import { useState, useCallback, useEffect, useRef } from "react";
import type { Event, ViewModel } from "./types";

// ── WASM lazy-load ────────────────────────────────────────────────────────────

// The wasm/ directory is populated by running:
//   wasm-pack build product/shared --target web --out-dir ../web-app/src/wasm
// During development without built WASM we fall back to a stub.

import type * as SharedWasm from "./wasm/shared.js";

type WasmModule = typeof SharedWasm;

let wasmModule: WasmModule | null = null;

async function loadWasm(): Promise<WasmModule> {
    if (wasmModule) return wasmModule;
    const mod = await import("./wasm/shared.js") as WasmModule;
    await mod.default();
    wasmModule = mod;
    return mod;
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
        default:
            return {
                type: "effect_error",
                message: `unknown storage op: ${req.op}`,
            } as unknown as Event;
    }
}

// ── Core hook ─────────────────────────────────────────────────────────────────

export function useApp() {
    const [viewModel, setViewModel] = useState<ViewModel>({ screen: "loading" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleRef = useRef<InstanceType<WasmModule["AppHandle"]> | null>(null);

    const dispatch = useCallback(async (event: Event) => {
        setBusy(true);
        setError(null);
        try {
            // Lazy-init WASM handle.
            if (!handleRef.current) {
                const mod = await loadWasm();
                handleRef.current = new mod.AppHandle();
            }
            const handle = handleRef.current;

            // Step 1: dispatch event → get effects JSON.
            const effectsJson = handle.dispatch(JSON.stringify(event));
            const effects = JSON.parse(effectsJson) as Array<Record<string, unknown>>;

            // Step 2: execute effects, collect responses.
            // Effect JSON shape: {"type": "storage", "op": "load_settings", ...}
            // (Effect uses #[serde(tag = "type")] and StorageRequest uses #[serde(tag = "op")],
            //  so both tags appear in the same flat object.)
            const responses: Event[] = [];
            for (const eff of effects) {
                if (eff.type === "storage") {
                    responses.push(executeStorageEffect(eff));
                }
                // Render and Http effects are ignored (render is implicit; no HTTP in POC).
            }

            // Step 3: feed responses back.
            for (const resp of responses) {
                const moreJson = handle.dispatch(JSON.stringify(resp));
                const more = JSON.parse(moreJson) as Array<Record<string, unknown>>;
                for (const eff of more) {
                    if (eff.type === "storage") {
                        const resp2 = executeStorageEffect(eff as Record<string, unknown>);
                        handle.dispatch(JSON.stringify(resp2));
                    }
                }
            }

            // Step 4: get view.
            const vmJson = handle.view();
            setViewModel(JSON.parse(vmJson) as ViewModel);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            setViewModel({ screen: "error", message: msg });
        } finally {
            setBusy(false);
        }
    }, []);

    // Bootstrap: send AppStarted with no data_folder (web uses localStorage).
    useEffect(() => {
        dispatch({ type: "app_started", data_folder: "browser" });
    }, [dispatch]);

    return { viewModel, dispatch, busy, error };
}

// No folder dialog in the browser — the web-app skips first-launch flow
// by always providing a virtual "browser" data_folder.
export async function openFolderDialog(): Promise<string | null> {
    return null;
}
