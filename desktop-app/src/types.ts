/** Types matching CRUX ViewModel and domain models. */

export interface ViewModel {
    text: string;
    notes: NoteView[];
    topics: TopicView[];
    error: string | null;
}

export interface NoteView {
    id: string;
    title: string;
    content_raw: string;
    source_type: SourceType;
    created_at: string;
    updated_at: string;
    topic_names: string[];
    topic_ids: string[];
}

export interface TopicView {
    id: string;
    name: string;
    description: string | null;
    note_count: number;
}

export type SourceType = "typed" | "pasted" | "uploaded" | "captured";

/** Request types for Tauri invocations. */

export interface CreateNoteRequest {
    title: string;
    content: string;
    topic_ids: string[];
}

export interface UpdateNoteRequest {
    id: string;
    title: string;
    content: string;
}

export interface CreateTopicRequest {
    name: string;
    description: string | null;
}
