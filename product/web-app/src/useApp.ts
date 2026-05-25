import { useState, useCallback, useEffect, useRef } from "react";
import type React from "react";
import type { Event, ViewModel } from "./types";

// ── WASM lazy-load ────────────────────────────────────────────────────────────

// The wasm/ directory is populated by running:
//   wasm-pack build product/shared --target web --out-dir ../web-app/src/wasm
// During development without built WASM we fall back to a stub.

import type * as SharedWasm from "./wasm/shared.js";

type WasmModule = typeof SharedWasm;

let wasmModule: WasmModule | null = null;
let wasmLoadPromise: Promise<WasmModule> | null = null;

async function loadWasm(): Promise<WasmModule> {
    if (wasmModule) return wasmModule;
    if (!wasmLoadPromise) {
        wasmLoadPromise = (async () => {
            const mod = await import("./wasm/shared.js") as WasmModule;
            await mod.default();
            wasmModule = mod;
            return mod;
        })();
    }
    return wasmLoadPromise;
}

// ── Local storage back-end (POC browser storage) ──────────────────────────────

const LS_PREFIX = "mlmm:";

function lsGet(key: string): string | null {
    return localStorage.getItem(LS_PREFIX + key);
}
function lsSet(key: string, value: string) {
    localStorage.setItem(LS_PREFIX + key, value);
}

type LsData = {
    settings?: Record<string, unknown>;
    spaces?: unknown[];
    notes?: Record<string, unknown>;
};

function getData(): LsData {
    const raw = lsGet("data");
    return raw ? JSON.parse(raw) : {};
}
function saveData(d: LsData) {
    lsSet("data", JSON.stringify(d));
}

// Execute a StorageRequest (serialized as JSON) and return a response Event.
function executeStorageEffect(req: Record<string, unknown>): Event {
    const d = getData();

    switch (req.op) {
        case "load_settings": {
            const settings = d.settings ?? { data_folder: null, theme: "dark" };
            return { type: "settings_loaded", settings } as unknown as Event;
        }
        case "save_settings": {
            d.settings = req.settings as Record<string, unknown>;
            saveData(d);
            return {
                type: "settings_loaded",
                settings: req.settings,
            } as unknown as Event;
        }
        case "load_spaces": {
            return {
                type: "spaces_loaded",
                spaces: d.spaces ?? [],
            } as unknown as Event;
        }
        case "create_space": {
            const spaces = (d.spaces ?? []) as unknown[];
            spaces.push(req.space);
            d.spaces = spaces;
            saveData(d);
            return { type: "space_created", space: req.space } as unknown as Event;
        }
        case "delete_space": {
            d.spaces = ((d.spaces ?? []) as Array<{ id: unknown }>).filter(
                (s) => s.id !== req.id
            );
            const notes = d.notes ?? {};
            Object.keys(notes).forEach((k) => {
                if (k.startsWith(String(req.id) + "/")) delete notes[k];
            });
            d.notes = notes;
            saveData(d);
            return { type: "space_deleted", id: req.id } as unknown as Event;
        }
        case "load_notes": {
            const notes = d.notes ?? {};
            const ids = Object.keys(notes).filter((k) =>
                k.startsWith(String(req.space_id) + "/")
            );
            return {
                type: "note_list_loaded",
                space_id: req.space_id,
                note_ids: ids,
            } as unknown as Event;
        }
        case "load_labels": {
            const notes = (d.notes ?? {}) as Record<string, { metadata?: { labels?: string[] } }>;
            const labelSet = new Set<string>();
            for (const note of Object.values(notes)) {
                const labels = note.metadata?.labels;
                if (Array.isArray(labels)) {
                    labels.forEach((l: string) => labelSet.add(l));
                }
            }
            return {
                type: "labels_loaded",
                labels: Array.from(labelSet),
            } as unknown as Event;
        }
        case "load_note": {
            const notes = (d.notes ?? {}) as Record<string, unknown>;
            const note = notes[String(req.id)];
            if (!note)
                return {
                    type: "effect_error",
                    message: `note not found: ${req.id}`,
                } as unknown as Event;
            return { type: "note_loaded", note } as unknown as Event;
        }
        case "load_note_for_list": {
            const notes = (d.notes ?? {}) as Record<string, unknown>;
            const note = notes[String(req.id)];
            if (!note)
                return {
                    type: "effect_error",
                    message: `note not found: ${req.id}`,
                } as unknown as Event;
            return { type: "note_list_item_loaded", note } as unknown as Event;
        }
        case "save_note": {
            const notes = (d.notes ?? {}) as Record<string, unknown>;
            const n = req.note as { id: string };
            notes[n.id] = req.note;
            d.notes = notes;
            saveData(d);
            return { type: "note_saved", id: n.id } as unknown as Event;
        }
        case "delete_note": {
            const notes = (d.notes ?? {}) as Record<string, unknown>;
            delete notes[String(req.id)];
            d.notes = notes;
            saveData(d);
            return { type: "note_deleted", id: req.id } as unknown as Event;
        }
        case "delete_draft": {
            const notes = (d.notes ?? {}) as Record<string, unknown>;
            delete notes[String(req.id)];
            d.notes = notes;
            saveData(d);
            return { type: "note_deleted", id: req.id } as unknown as Event;
        }
        default:
            return {
                type: "effect_error",
                message: `unknown storage op: ${req.op}`,
            } as unknown as Event;
    }
}

// ── WASM event-loop helpers ───────────────────────────────────────────────────

type AppHandle = InstanceType<WasmModule["AppHandle"]>;

/** Dispatch one event through the WASM handle, process all storage effects, and
 *  return the updated view-model JSON string. Pure computation – no React state. */
async function runEvent(
    handleRef: React.MutableRefObject<AppHandle | null>,
    event: Event,
): Promise<string> {
    if (!handleRef.current) {
        const mod = await loadWasm();
        handleRef.current = new mod.AppHandle();
    }
    const handle = handleRef.current;

    // Dispatch the event, then drain the effect queue until no more storage
    // effects remain. Each storage effect produces a response event that may
    // in turn produce more effects (e.g. CreateNote → SaveNote → NoteSaved →
    // LoadNote → NoteLoaded → Render).
    let pendingEffects = JSON.parse(
        handle.dispatch(JSON.stringify(event))
    ) as Array<Record<string, unknown>>;

    while (true) {
        const storageEffects = pendingEffects.filter(e => e.type === "storage");
        if (storageEffects.length === 0) break;

        const nextPending: Array<Record<string, unknown>> = [];
        for (const eff of storageEffects) {
            const resp = executeStorageEffect(eff);
            const moreEffects = JSON.parse(
                handle.dispatch(JSON.stringify(resp))
            ) as Array<Record<string, unknown>>;
            nextPending.push(...moreEffects);
        }
        pendingEffects = nextPending;
    }

    return handle.view();
}

// ── Core hook ─────────────────────────────────────────────────────────────────

export function useApp() {
    const [viewModel, setViewModel] = useState<ViewModel>({ screen: "loading" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleRef = useRef<AppHandle | null>(null);

    // Bootstrap: initialize WASM and send the first event.
    // State is updated via .then()/.catch() callbacks (not directly in the effect body).
    useEffect(() => {
        let cancelled = false;

        runEvent(handleRef, { type: "app_started", data_folder: "browser" })
            .then(vmJson => {
                if (!cancelled) setViewModel(JSON.parse(vmJson) as ViewModel);
            })
            .catch(e => {
                const msg = e instanceof Error ? e.message : String(e);
                if (!cancelled) {
                    setError(msg);
                    setViewModel({ screen: "error", message: msg });
                }
            });

        return () => { cancelled = true; };
    }, []);

    const dispatch = useCallback(async (event: Event) => {
        setBusy(true);
        setError(null);
        try {
            const vmJson = await runEvent(handleRef, event);
            setViewModel(JSON.parse(vmJson) as ViewModel);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            setViewModel({ screen: "error", message: msg });
        } finally {
            setBusy(false);
        }
    }, []);

    return { viewModel, dispatch, busy, error };
}

// No folder dialog in the browser — the web-app skips first-launch flow
// by always providing a virtual "browser" data_folder.
export async function openFolderDialog(): Promise<string | null> {
    return null;
}
