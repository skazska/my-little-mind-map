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
            // Persist the data-folder path when the user selects one. [S-CFG-1]
            if (event.type === "data_folder_selected") {
                await invoke("save_data_folder_config", { path: event.path }).catch(() => { });
            }
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
        let cancelled = false;
        (async () => {
            // Read the persisted data-folder from app config dir. [S-CFG-1]
            const dataFolder = await invoke<string | null>("get_data_folder_config").catch(() => null);
            if (!cancelled) {
                await dispatch({ type: "app_started", data_folder: dataFolder ?? undefined });
            }
        })();
        return () => { cancelled = true; };
    }, [dispatch]);

    return { viewModel, dispatch, busy, error };
}

// ── Folder dialog ─────────────────────────────────────────────────────────────

export async function openFolderDialog(): Promise<string | null> {
    const result = await invoke<string | null>("open_folder_dialog");
    return result ?? null;
}

export async function getDefaultDataFolder(): Promise<string | null> {
    return invoke<string>("get_default_data_folder").catch(() => null);
}
