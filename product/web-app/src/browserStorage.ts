import type { Event } from "./types";

const LS_FILE_PREFIX = "mlmm:file:";

type Label = string;

type Space = {
    id: string;
    name: string;
    description?: string | null;
    labels: Label[];
    parent_id?: string | null;
    note_count?: number;
};

type SpaceEntry = Space & {
    child_ids: string[];
    note_count: number;
};

type SpacesIndex = {
    spaces: SpaceEntry[];
};

type NoteReferenceTarget =
    | { kind: "note"; id: string }
    | { kind: "space"; id: string }
    | { kind: "view"; id: string }
    | { kind: "file"; path: string }
    | { kind: "external"; url: string };

type NoteReference = {
    target: NoteReferenceTarget;
    block_id?: string | null;
    source_block_id?: string | null;
};

type NoteMetadata = {
    uuid: string;
    title: string;
    space?: string | null;
    labels: Label[];
    references: NoteReference[];
    created_at: string;
    updated_at: string;
    draft: boolean;
};

type Note = {
    id: string;
    metadata: NoteMetadata;
    content: string;
    parent_id?: string | null;
};

type Settings = {
    data_folder?: string | null;
    default_space?: string | null;
    theme?: string | null;
};

type LabelsIndex = {
    entries: Record<string, string[]>;
};

type ReferencesIndex = {
    forward: Record<string, RefEntry[]>;
    backward: Record<string, RefEntry[]>;
};

type RefEntry = {
    note_id: string;
    block_id?: string | null;
};

type DefinitionsIndex = {
    entries: Record<string, DefEntry[]>;
};

type DefEntry = {
    note_id: string;
    definition: string;
    block_id?: string | null;
};

type NotesIndex = {
    notes: NoteEntry[];
};

type NoteEntry = {
    id: string;
    title: string;
    space_id: string;
    parent_id: string | null;
    labels: string[];
    draft: boolean;
    updated_at: string;
    path: string;
};

type RawReference = {
    kind: string;
    target: string;
    block_id?: string | null;
    source_block_id?: string | null;
};

function fileKey(path: string): string {
    return `${LS_FILE_PREFIX}${path}`;
}

function readFile(path: string): string | null {
    return localStorage.getItem(fileKey(path));
}

function writeFile(path: string, value: string): void {
    localStorage.setItem(fileKey(path), value);
}

function deleteFile(path: string): void {
    localStorage.removeItem(fileKey(path));
}

function listFilePaths(): string[] {
    const paths: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(LS_FILE_PREFIX)) {
            paths.push(key.slice(LS_FILE_PREFIX.length));
        }
    }
    return paths.sort();
}

function deleteTree(pathPrefix: string): void {
    for (const path of listFilePaths()) {
        if (path === pathPrefix || path.startsWith(`${pathPrefix}/`)) {
            deleteFile(path);
        }
    }
}

function readJson<T>(path: string, fallback: T): T {
    const raw = readFile(path);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
}

function writeJson(path: string, value: unknown): void {
    writeFile(path, JSON.stringify(value, null, 2));
}

function ensureLayoutFiles(): void {
    ensureJson("settings.json", { data_folder: null, default_space: null, theme: "dark" });
    ensureJson("views.json", { views: [] });
    ensureJson("history.json", { entries: [] });
    ensureJson("spaces.json", { spaces: [] });
    ensureJson("notes.json", { notes: [] });
    ensureJson("labels.json", { entries: {} });
    ensureJson("references.json", { forward: {}, backward: {} });
    ensureJson("definitions.json", { entries: {} });
}

function ensureJson(path: string, value: unknown): void {
    if (readFile(path) === null) {
        writeJson(path, value);
    }
}

function spaceDirPath(id: string): string {
    return `spaces/${id.split(".").reverse().join("/")}`;
}

function publishedNotePath(id: string): string {
    return `spaces/${id}.md`;
}

function draftNotePath(id: string): string {
    return `spaces/${id}/draft.md`;
}

function parentNoteId(id: string): string | null {
    const parts = id.split("/");
    if (parts.length <= 2) return null;
    // The parent is the next path segment up, but only when that path is itself a
    // note; otherwise it is the space directory of a nested child space. @S-DM-N3
    const candidate = parts.slice(0, -1).join("/");
    return noteFileExists(candidate) ? candidate : null;
}

function noteFileExists(id: string): boolean {
    return readFile(publishedNotePath(id)) !== null || readFile(draftNotePath(id)) !== null;
}

function spaceIdFromNoteId(id: string): string {
    return id.split("/")[0] ?? id;
}

function notePathToId(path: string): string | null {
    if (!path.startsWith("spaces/") || !path.endsWith(".md")) return null;
    if (path.endsWith("/draft.md")) return path.slice("spaces/".length, -"/draft.md".length);
    return path.slice("spaces/".length, -".md".length);
}

function isDirectChildOfSpace(noteId: string, spaceId: string): boolean {
    const spaceSegments = spaceId.split(".").reverse();
    const noteSegments = noteId.split("/");
    return noteSegments.length === spaceSegments.length + 1
        && spaceSegments.every((segment, index) => noteSegments[index] === segment);
}

function normalizeSpace(space: Space): Space {
    return {
        id: space.id,
        name: space.name,
        description: space.description ?? null,
        labels: Array.isArray(space.labels) ? space.labels : [],
        parent_id: space.parent_id ?? null,
        note_count: space.note_count ?? 0,
    };
}

function toSpaceEntry(space: Space): SpaceEntry {
    const normalized = normalizeSpace(space);
    return {
        ...normalized,
        child_ids: [],
        note_count: normalized.note_count ?? 0,
    };
}

function upsertSpace(index: SpacesIndex, space: Space): void {
    const entry = toSpaceEntry(space);
    const existingIndex = index.spaces.findIndex((candidate) => candidate.id === entry.id);
    if (existingIndex >= 0) {
        entry.child_ids = index.spaces[existingIndex].child_ids;
        index.spaces[existingIndex] = entry;
    } else {
        index.spaces.push(entry);
    }
    if (entry.parent_id) {
        const parent = index.spaces.find((candidate) => candidate.id === entry.parent_id);
        if (parent && !parent.child_ids.includes(entry.id)) {
            parent.child_ids.push(entry.id);
        }
    }
}

function spaceForEvent(entry: SpaceEntry): Space {
    return {
        id: entry.id,
        name: entry.name,
        description: entry.description ?? null,
        labels: entry.labels,
        parent_id: entry.parent_id ?? null,
        note_count: entry.note_count,
    };
}

function serializeFrontMatter(note: Note): string {
    const references = note.metadata.references.map(referenceToRaw);
    const lines = [
        "---",
        `uuid: ${yamlString(note.metadata.uuid)}`,
        `title: ${yamlString(note.metadata.title)}`,
    ];
    if (note.metadata.space) {
        lines.push(`space: ${yamlString(note.metadata.space)}`);
    }
    lines.push(`labels: ${yamlString(note.metadata.labels.join(" "))}`);
    if (references.length > 0) {
        lines.push("references:");
        for (const reference of references) {
            lines.push(`  - kind: ${yamlString(reference.kind)}`);
            lines.push(`    target: ${yamlString(reference.target)}`);
            if (reference.block_id) lines.push(`    block_id: ${yamlString(reference.block_id)}`);
            if (reference.source_block_id) {
                lines.push(`    source_block_id: ${yamlString(reference.source_block_id)}`);
            }
        }
    }
    lines.push(`created_at: ${yamlString(note.metadata.created_at)}`);
    lines.push(`updated_at: ${yamlString(note.metadata.updated_at)}`);
    lines.push(`draft: ${note.metadata.draft ? "true" : "false"}`);
    lines.push("---");
    lines.push("");
    lines.push(note.content);
    return lines.join("\n");
}

function parseNoteFile(id: string, raw: string): Note {
    const { frontMatter, body } = splitFrontMatter(raw);
    const rawReferences = parseRawReferences(frontMatter);
    const metadata: NoteMetadata = {
        uuid: readYamlString(frontMatter, "uuid") ?? "",
        title: readYamlString(frontMatter, "title") ?? id.split("/").at(-1) ?? id,
        space: readYamlString(frontMatter, "space"),
        labels: (readYamlString(frontMatter, "labels") ?? "").split(/\s+/).filter(Boolean),
        references: rawReferences.map(rawToReference),
        created_at: readYamlString(frontMatter, "created_at") ?? new Date(0).toISOString(),
        updated_at: readYamlString(frontMatter, "updated_at") ?? new Date(0).toISOString(),
        draft: readYamlBoolean(frontMatter, "draft"),
    };
    return {
        id,
        metadata,
        content: body.replace(/^\s+/, ""),
        parent_id: parentNoteId(id),
    };
}

function splitFrontMatter(raw: string): { frontMatter: string; body: string } {
    const text = raw.trimStart();
    if (!text.startsWith("---")) {
        throw new Error("missing note frontmatter");
    }
    const afterOpen = text.slice(3).replace(/^[\r\n]+/, "");
    const closeIndex = afterOpen.indexOf("\n---");
    if (closeIndex < 0) {
        throw new Error("missing note frontmatter terminator");
    }
    return {
        frontMatter: afterOpen.slice(0, closeIndex),
        body: afterOpen.slice(closeIndex + "\n---".length),
    };
}

function yamlString(value: string): string {
    return JSON.stringify(value);
}

function readYamlString(frontMatter: string, key: string): string | null {
    const line = frontMatter.split(/\r?\n/).find((candidate) => candidate.startsWith(`${key}:`));
    if (!line) return null;
    const value = line.slice(key.length + 1).trim();
    if (value === "") return "";
    if (value.startsWith('"')) return JSON.parse(value) as string;
    return value;
}

function readYamlBoolean(frontMatter: string, key: string): boolean {
    return readYamlString(frontMatter, key) === "true";
}

function parseRawReferences(frontMatter: string): RawReference[] {
    const references: RawReference[] = [];
    let current: RawReference | null = null;
    for (const line of frontMatter.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("- kind:")) {
            if (current) references.push(current);
            current = { kind: parseYamlScalar(trimmed.slice("- kind:".length)), target: "" };
        } else if (current && trimmed.startsWith("target:")) {
            current.target = parseYamlScalar(trimmed.slice("target:".length));
        } else if (current && trimmed.startsWith("block_id:")) {
            current.block_id = parseYamlScalar(trimmed.slice("block_id:".length));
        } else if (current && trimmed.startsWith("source_block_id:")) {
            current.source_block_id = parseYamlScalar(trimmed.slice("source_block_id:".length));
        }
    }
    if (current) references.push(current);
    return references.filter((reference) => reference.kind && reference.target);
}

function parseYamlScalar(value: string): string {
    const trimmed = value.trim();
    if (trimmed.startsWith('"')) return JSON.parse(trimmed) as string;
    return trimmed;
}

function referenceToRaw(reference: NoteReference): RawReference {
    const target = reference.target;
    const raw: RawReference = {
        kind: target.kind,
        target: targetToString(target),
    };
    if (reference.block_id) raw.block_id = reference.block_id;
    if (reference.source_block_id) raw.source_block_id = reference.source_block_id;
    return raw;
}

function targetToString(target: NoteReferenceTarget): string {
    switch (target.kind) {
        case "note":
        case "space":
        case "view":
            return target.id;
        case "file":
            return target.path;
        case "external":
            return target.url;
    }
}

function rawToReference(raw: RawReference): NoteReference {
    return {
        target: rawTargetToReferenceTarget(raw),
        block_id: raw.block_id ?? null,
        source_block_id: raw.source_block_id ?? null,
    };
}

function rawTargetToReferenceTarget(raw: RawReference): NoteReferenceTarget {
    switch (raw.kind) {
        case "note":
            return { kind: "note", id: raw.target };
        case "space":
            return { kind: "space", id: raw.target };
        case "view":
            return { kind: "view", id: raw.target };
        case "file":
            return { kind: "file", path: raw.target };
        default:
            return { kind: "external", url: raw.target };
    }
}

function readNote(id: string): Note | null {
    try {
        const draft = readFile(draftNotePath(id));
        if (draft !== null) return parseNoteFile(id, draft);
        const published = readFile(publishedNotePath(id));
        if (published !== null) return parseNoteFile(id, published);
        return null;
    } catch {
        return null;
    }
}

function readAllNotes(): Note[] {
    const ids = new Set<string>();
    for (const path of listFilePaths()) {
        const id = notePathToId(path);
        if (id) ids.add(id);
    }
    return Array.from(ids).sort().map(readNote).filter((note): note is Note => note !== null);
}

function saveNote(note: Note): void {
    if (note.metadata.draft) {
        writeFile(draftNotePath(note.id), serializeFrontMatter(note));
    } else {
        writeFile(publishedNotePath(note.id), serializeFrontMatter(note));
        deleteFile(draftNotePath(note.id));
    }
    rebuildDerivedIndexes();
}

function deleteNote(id: string): void {
    deleteFile(publishedNotePath(id));
    deleteFile(draftNotePath(id));
    deleteTree(`spaces/${id}`);
    rebuildDerivedIndexes();
}

function deleteDraft(id: string): void {
    deleteFile(draftNotePath(id));
    rebuildDerivedIndexes();
}

function rebuildDerivedIndexes(): void {
    const notes = readAllNotes();
    const spacesIndex = rebuildSpacesIndex(notes);
    writeJson("spaces.json", spacesIndex);
    writeJson("notes.json", buildNotesIndex(notes, spacesIndex));
    writeJson("labels.json", buildLabelsIndex(notes));
    writeJson("references.json", buildReferencesIndex(notes));
    writeJson("definitions.json", buildDefinitionsIndex(notes));
}

function rebuildSpacesIndex(notes: Note[]): SpacesIndex {
    const index = readJson<SpacesIndex>("spaces.json", { spaces: [] });
    const byId = new Map<string, SpaceEntry>();
    for (const entry of index.spaces) {
        byId.set(entry.id, { ...entry, child_ids: [], note_count: 0 });
    }
    for (const entry of byId.values()) {
        if (entry.parent_id) {
            const parent = byId.get(entry.parent_id);
            if (parent && !parent.child_ids.includes(entry.id)) parent.child_ids.push(entry.id);
        }
    }
    for (const note of notes) {
        for (const entry of byId.values()) {
            if (isDirectChildOfSpace(note.id, entry.id)) {
                entry.note_count += 1;
            }
        }
    }
    return { spaces: Array.from(byId.values()).sort((left, right) => left.id.localeCompare(right.id)) };
}

function buildNotesIndex(notes: Note[], spacesIndex: SpacesIndex): NotesIndex {
    return {
        notes: notes.map((note) => ({
            id: note.id,
            title: note.metadata.title,
            space_id: spaceIdForNoteId(note.id, spacesIndex),
            parent_id: note.parent_id ?? null,
            labels: note.metadata.labels,
            draft: note.metadata.draft,
            updated_at: note.metadata.updated_at,
            path: note.metadata.draft ? draftNotePath(note.id) : publishedNotePath(note.id),
        })),
    };
}

function spaceIdForNoteId(noteId: string, spacesIndex: SpacesIndex): string {
    const matchingSpace = [...spacesIndex.spaces]
        .sort((left, right) => right.id.split(".").length - left.id.split(".").length)
        .find((space) => isDirectChildOfSpace(noteId, space.id));
    return matchingSpace?.id ?? spaceIdFromNoteId(noteId);
}

function buildLabelsIndex(notes: Note[]): LabelsIndex {
    const entries: Record<string, string[]> = {};
    for (const note of notes) {
        for (const label of note.metadata.labels) {
            entries[label] = entries[label] ?? [];
            if (!entries[label].includes(note.id)) entries[label].push(note.id);
        }
    }
    return { entries: sortRecordArrays(entries) };
}

function buildReferencesIndex(notes: Note[]): ReferencesIndex {
    const forward: Record<string, RefEntry[]> = {};
    const backward: Record<string, RefEntry[]> = {};
    for (const note of notes) {
        for (const reference of note.metadata.references) {
            const target = targetToString(reference.target);
            forward[note.id] = forward[note.id] ?? [];
            forward[note.id].push({ note_id: target, block_id: reference.block_id ?? null });
            backward[target] = backward[target] ?? [];
            backward[target].push({ note_id: note.id, block_id: reference.source_block_id ?? null });
        }
    }
    return { forward: sortRecordEntries(forward), backward: sortRecordEntries(backward) };
}

function buildDefinitionsIndex(notes: Note[]): DefinitionsIndex {
    const entries: Record<string, DefEntry[]> = {};
    for (const note of notes) {
        for (const definition of extractDefinitions(note)) {
            entries[definition.term] = entries[definition.term] ?? [];
            entries[definition.term].push({
                note_id: note.id,
                definition: definition.definition,
                block_id: null,
            });
        }
    }
    return { entries: sortRecordEntries(entries) };
}

function extractDefinitions(note: Note): Array<{ term: string; definition: string }> {
    return note.content.split(/\r?\n/).flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("**")) return [];
        const rest = trimmed.slice(2);
        const termEnd = rest.indexOf("**");
        if (termEnd < 0) return [];
        const term = rest.slice(0, termEnd).trim();
        const definition = rest.slice(termEnd + 2).trim();
        if (!term || !definition) return [];
        return [{ term: term.toLowerCase(), definition }];
    });
}

function sortRecordArrays(entries: Record<string, string[]>): Record<string, string[]> {
    const sorted: Record<string, string[]> = {};
    for (const key of Object.keys(entries).sort()) {
        sorted[key] = [...entries[key]].sort();
    }
    return sorted;
}

function sortRecordEntries<T>(entries: Record<string, T[]>): Record<string, T[]> {
    const sorted: Record<string, T[]> = {};
    for (const key of Object.keys(entries).sort()) {
        sorted[key] = entries[key];
    }
    return sorted;
}

function noteIdsForSpace(spaceId: string): string[] {
    // Return the full note subtree owned by this space (descendants included for
    // tree rendering), excluding notes owned by nested child spaces. @(S-DM-N3,S-DM-S1)
    const spacesIndex = readJson<SpacesIndex>("spaces.json", { spaces: [] });
    return readAllNotes()
        .map((note) => note.id)
        .filter((id) => spaceIdForNoteId(id, spacesIndex) === spaceId)
        .sort();
}

function effectError(message: string): Event {
    return { type: "effect_error", message } as unknown as Event;
}

// Execute a StorageRequest against the browser-local virtual file tree.
// S-ST-LS3 maps every `mlmm:file:<path>` key to the same path in the S-ST-DM4
// git-compatible folder-note layout; S-ST-IX1 indexes are regenerated here.
export function executeStorageEffect(req: Record<string, unknown>): Event {
    try {
        ensureLayoutFiles();

        switch (req.op) {
            case "load_settings": {
                const settings = readJson<Settings>("settings.json", { data_folder: null, theme: "dark" });
                return { type: "settings_loaded", settings } as unknown as Event;
            }
            case "save_settings": {
                const settings = req.settings as Settings;
                writeJson("settings.json", settings);
                return { type: "settings_loaded", settings } as unknown as Event;
            }
            case "load_spaces": {
                rebuildDerivedIndexes();
                const index = readJson<SpacesIndex>("spaces.json", { spaces: [] });
                return {
                    type: "spaces_loaded",
                    spaces: index.spaces.map(spaceForEvent),
                } as unknown as Event;
            }
            case "create_space": {
                const space = normalizeSpace(req.space as Space);
                const index = readJson<SpacesIndex>("spaces.json", { spaces: [] });
                upsertSpace(index, space);
                writeJson("spaces.json", index);
                rebuildDerivedIndexes();
                return { type: "space_created", space } as unknown as Event;
            }
            case "delete_space": {
                const id = String(req.id);
                const index = readJson<SpacesIndex>("spaces.json", { spaces: [] });
                index.spaces = index.spaces.filter((space) => space.id !== id && space.parent_id !== id);
                for (const space of index.spaces) {
                    space.child_ids = space.child_ids.filter((childId) => childId !== id);
                }
                writeJson("spaces.json", index);
                deleteTree(spaceDirPath(id));
                rebuildDerivedIndexes();
                return { type: "space_deleted", id } as unknown as Event;
            }
            case "load_notes": {
                const spaceId = String(req.space_id);
                return {
                    type: "note_list_loaded",
                    space_id: spaceId,
                    note_ids: noteIdsForSpace(spaceId),
                } as unknown as Event;
            }
            case "load_labels": {
                rebuildDerivedIndexes();
                const labels = readJson<LabelsIndex>("labels.json", { entries: {} });
                return {
                    type: "labels_loaded",
                    labels: Object.keys(labels.entries).sort(),
                } as unknown as Event;
            }
            case "load_note": {
                const note = readNote(String(req.id));
                if (!note) return effectError(`note not found: ${req.id}`);
                return { type: "note_loaded", note } as unknown as Event;
            }
            case "load_note_for_list": {
                const note = readNote(String(req.id));
                if (!note) return effectError(`note not found: ${req.id}`);
                return { type: "note_list_item_loaded", note } as unknown as Event;
            }
            case "save_note": {
                const note = req.note as Note;
                saveNote(note);
                return { type: "note_saved", id: note.id } as unknown as Event;
            }
            case "delete_note": {
                const id = String(req.id);
                deleteNote(id);
                return { type: "note_deleted", id } as unknown as Event;
            }
            case "delete_draft": {
                const id = String(req.id);
                deleteDraft(id);
                return { type: "note_deleted", id } as unknown as Event;
            }
            default:
                return effectError(`unknown storage op: ${req.op}`);
        }
    } catch (error) {
        return effectError(error instanceof Error ? error.message : String(error));
    }
}