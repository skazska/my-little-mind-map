import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { Root } from "mdast";

/** Parse raw markdown to mdast AST. */
export function parseMarkdown(raw: string): Root {
    return unified().use(remarkParse).parse(raw);
}

/** Serialize mdast AST back to markdown string. */
export function astToMarkdown(tree: Root): string {
    return String(unified().use(remarkStringify).stringify(tree));
}

export interface InternalReference {
    noteId: string;
    displayText: string;
}

const REFERENCE_RE = /\[\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\|([^\]]+)\]\]/gi;

/** Extract [[uuid|text]] internal references from raw markdown. */
export function extractReferences(raw: string): InternalReference[] {
    const refs: InternalReference[] = [];
    let match;
    while ((match = REFERENCE_RE.exec(raw)) !== null) {
        refs.push({ noteId: match[1], displayText: match[2] });
    }
    REFERENCE_RE.lastIndex = 0;
    return refs;
}

/**
 * Replace [[uuid|text]] patterns in raw markdown with rendered link markup for preview.
 * Broken references (where the target note was deleted) are shown with strikethrough.
 */
export function renderReferencesForPreview(raw: string, brokenIds: string[] = []): string {
    const brokenSet = new Set(brokenIds);
    return raw.replace(REFERENCE_RE, (_match, id: string, text: string) => {
        if (brokenSet.has(id)) {
            return `<del>${text} (broken link)</del>`;
        }
        return `**[${text}](#)**`;
    });
}
