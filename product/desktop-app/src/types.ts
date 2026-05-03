// ── ViewModel types (mirrors product/shared/src/viewmodel.rs) ─────────────────

export type OverviewTab = "spaces" | "labels" | "views" | "recent" | "search";

export interface SpaceSummary {
    id: string;
    name: string;
    description?: string;
    labels: string[];
    note_count: number;
}

export interface LabelSummary {
    label: string;
    note_count: number;
}

export interface NoteListItem {
    id: string;
    title: string;
    description?: string;
    labels: string[];
    draft: boolean;
    updated_at: string;
}

export interface OverviewViewModel {
    active_tab: OverviewTab;
    spaces: SpaceSummary[];
    labels: LabelSummary[];
    search_query: string;
    data_folder?: string;
    error?: string;
}

export interface NoteListViewModel {
    space_id: string;
    space_name: string;
    notes: NoteListItem[];
    search_query: string;
    active_view_labels: string[];
    error?: string;
}

export interface NoteEditorViewModel {
    id: string;
    title: string;
    content: string;
    labels: string[];
    space_id?: string;
    draft: boolean;
    error?: string;
}

export type ViewModel =
    | { screen: "loading" }
    | { screen: "first_launch" }
    | { screen: "overview"; active_tab: OverviewTab; spaces: SpaceSummary[]; labels: LabelSummary[]; search_query: string; data_folder?: string; error?: string }
    | { screen: "note_list"; space_id: string; space_name: string; notes: NoteListItem[]; search_query: string; active_view_labels: string[]; error?: string }
    | { screen: "note_editor"; id: string; title: string; content: string; labels: string[]; space_id?: string; draft: boolean; error?: string }
    | { screen: "error"; message: string };

// ── Event types (mirrors product/shared/src/event.rs) ─────────────────────────

export type Event =
    | { type: "app_started"; data_folder?: string }
    | { type: "data_folder_selected"; path: string }
    | { type: "navigate_overview"; tab: OverviewTab }
    | { type: "navigate_to_space"; id: string }
    | { type: "navigate_to_note"; id: string }
    | { type: "navigate_back" }
    | { type: "create_space"; name: string; description?: string }
    | { type: "delete_space"; id: string }
    | { type: "create_note"; title: string; space_id: string; parent_id?: string }
    | { type: "update_note"; id: string; content: string; labels: string[] }
    | { type: "publish_note"; id: string }
    | { type: "delete_note"; id: string }
    | { type: "set_active_view"; labels: string[] }
    | { type: "clear_view" }
    | { type: "search_changed"; query: string };
