import { invoke } from "@tauri-apps/api/core";
import { useState, useCallback, useEffect } from "react";
import type { Event, ViewModel } from "./types";

// ── Core hook ─────────────────────────────────────────────────────────────────

/**
 * Wraps the Tauri `dispatch` command.
 * Sends an Event to the Rust core and updates `viewModel` with the result.
 */
export function useApp() {
    const [viewModel, setViewModel] = useState<ViewModel>({ screen: "loading" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dispatch = useCallback(async (event: Event) => {
        setBusy(true);
        setError(null);
        try {
            const json = await invoke<string>("dispatch", {
                eventJson: JSON.stringify(event),
            });
            setViewModel(JSON.parse(json) as ViewModel);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            setViewModel({ screen: "error", message: msg });
        } finally {
            setBusy(false);
        }
    }, []);

    // Bootstrap the app on mount.
    useEffect(() => {
        (async () => {
            // Try to load persisted data folder from settings via AppStarted event.
            await dispatch({ type: "app_started", data_folder: undefined });
        })();
    }, [dispatch]);

    return { viewModel, dispatch, busy, error };
}

// ── Folder dialog ─────────────────────────────────────────────────────────────

export async function openFolderDialog(): Promise<string | null> {
    const result = await invoke<string | null>("open_folder_dialog");
    return result ?? null;
}
