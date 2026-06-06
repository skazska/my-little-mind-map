import { useState, useCallback, useEffect, useRef } from "react";
import type React from "react";
import type { Event, ViewModel } from "./types";
import { executeStorageEffect } from "./browserStorage";

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
