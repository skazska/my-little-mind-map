import { useState, useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import { parseMarkdown, renderReferencesForPreview } from "../lib/markdown";
import type { Root } from "mdast";

export interface MarkdownEditorProps {
    initialContent?: string;
    onChange?: (raw: string, ast: Root) => void;
}

export function MarkdownEditor({ initialContent = "", onChange }: MarkdownEditorProps) {
    const [raw, setRaw] = useState(initialContent);

    const handleChange = useCallback(
        (value: string) => {
            setRaw(value);
            if (onChange) {
                const ast = parseMarkdown(value);
                onChange(value, ast);
            }
        },
        [onChange],
    );

    const previewContent = useMemo(() => renderReferencesForPreview(raw), [raw]);

    return (
        <div style={{ display: "flex", gap: "1rem", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <label htmlFor="md-source" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Source
                </label>
                <textarea
                    id="md-source"
                    value={raw}
                    onChange={(e) => handleChange(e.target.value)}
                    style={{
                        flex: 1,
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        padding: "0.5rem",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        resize: "none",
                    }}
                    spellCheck={false}
                />
            </div>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "auto",
                }}
            >
                <span style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Preview</span>
                <div
                    style={{
                        flex: 1,
                        padding: "0.5rem",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        overflow: "auto",
                    }}
                >
                    <Markdown>{previewContent}</Markdown>
                </div>
            </div>
        </div>
    );
}
