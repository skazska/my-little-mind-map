import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { parseMarkdown, renderReferencesForPreview } from "../lib/markdown";
import { NoteLinkAutocomplete } from "./NoteLinkAutocomplete";
import type { Root } from "mdast";
import type { NoteView, ViewModel } from "../types";

export interface MarkdownEditorProps {
    initialContent?: string;
    onChange?: (raw: string, ast: Root) => void;
    noteId?: string | null;
    onAssetAdded?: (view: ViewModel) => void;
    availableNotes?: NoteView[];
    brokenReferenceIds?: string[];
}

export function MarkdownEditor({
    initialContent = "",
    onChange,
    noteId,
    onAssetAdded,
    availableNotes = [],
    brokenReferenceIds = [],
}: MarkdownEditorProps) {
    const [raw, setRaw] = useState(initialContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Autocomplete state
    const [autocomplete, setAutocomplete] = useState<{
        active: boolean;
        query: string;
        position: { top: number; left: number };
        triggerPos: number; // cursor position where [[ was typed
    } | null>(null);

    // Sync raw state when initialContent changes externally (e.g. after asset upload)
    useEffect(() => {
        setRaw(initialContent);
    }, [initialContent]);

    const handleChange = useCallback(
        (value: string) => {
            setRaw(value);
            if (onChange) {
                const ast = parseMarkdown(value);
                onChange(value, ast);
            }

            // Detect [[ autocomplete trigger
            const textarea = textareaRef.current;
            if (!textarea) return;
            const cursorPos = textarea.selectionStart;
            const textUpToCursor = value.substring(0, cursorPos);

            // Find the last [[ that hasn't been closed
            const lastOpen = textUpToCursor.lastIndexOf("[[");
            if (lastOpen >= 0) {
                const afterOpen = textUpToCursor.substring(lastOpen + 2);
                // Only trigger if there's no ]] between [[ and cursor, and no newline
                if (!afterOpen.includes("]]") && !afterOpen.includes("\n")) {
                    const query = afterOpen;
                    // Estimate cursor position within the textarea
                    const textBeforeCursor = value.substring(0, cursorPos);
                    const lines = textBeforeCursor.split("\n");
                    const lineNumber = lines.length - 1;
                    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 18;
                    const rect = textarea.getBoundingClientRect();
                    const paddingTop = parseFloat(getComputedStyle(textarea).paddingTop) || 0;
                    const cursorTop = rect.top + paddingTop + lineNumber * lineHeight - textarea.scrollTop;
                    // Use fixed positioning so it's always visible in viewport
                    const position = {
                        top: Math.min(cursorTop + lineHeight + 4, rect.bottom),
                        left: rect.left + 16,
                    };

                    setAutocomplete({
                        active: true,
                        query,
                        position,
                        triggerPos: lastOpen,
                    });
                    return;
                }
            }
            setAutocomplete(null);
        },
        [onChange],
    );

    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            if (!noteId || !onAssetAdded) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith("image/")) {
                    const blob = item.getAsFile();
                    if (!blob) continue;

                    e.preventDefault();

                    const buffer = await blob.arrayBuffer();
                    const data = Array.from(new Uint8Array(buffer));

                    try {
                        const view = await invoke<ViewModel>("paste_asset", {
                            noteId,
                            data,
                            mimeType: item.type,
                        });
                        if (view.error) {
                            console.error("Paste asset error:", view.error);
                        } else {
                            onAssetAdded(view);
                        }
                    } catch (err) {
                        console.error("Failed to paste asset:", err);
                    }
                    return; // handled the image
                }
            }
            // If no image found, let default text paste proceed
        },
        [noteId, onAssetAdded],
    );

    const handleAutocompleteSelect = useCallback(
        (selectedNoteId: string, selectedTitle: string) => {
            if (!autocomplete) return;
            const textarea = textareaRef.current;
            if (!textarea) return;

            const before = raw.substring(0, autocomplete.triggerPos);
            const after = raw.substring(textarea.selectionStart);
            const reference = `[[${selectedNoteId}|${selectedTitle}]]`;
            const newValue = before + reference + after;

            setRaw(newValue);
            setAutocomplete(null);

            if (onChange) {
                const ast = parseMarkdown(newValue);
                onChange(newValue, ast);
            }

            // Restore focus and cursor position
            requestAnimationFrame(() => {
                textarea.focus();
                const newPos = before.length + reference.length;
                textarea.setSelectionRange(newPos, newPos);
            });
        },
        [autocomplete, raw, onChange],
    );

    const handleAutocompleteCancel = useCallback(() => {
        setAutocomplete(null);
        textareaRef.current?.focus();
    }, []);

    // Filter out current note from autocomplete suggestions
    const autocompleteNotes = useMemo(
        () => (noteId ? availableNotes.filter((n) => n.id !== noteId) : availableNotes),
        [availableNotes, noteId],
    );

    const previewContent = useMemo(() => renderReferencesForPreview(raw, brokenReferenceIds), [raw, brokenReferenceIds]);

    const imageComponent = useMemo(() => {
        if (!noteId) return undefined;
        return function AssetImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
            const src = props.src ?? "";
            if (src.startsWith("assets/")) {
                return <AssetImageLoader noteId={noteId} assetPath={src} alt={props.alt ?? ""} />;
            }
            return <img {...props} style={{ maxWidth: "100%" }} />;
        };
    }, [noteId]);

    const linkComponent = useMemo(() => {
        if (!noteId) return undefined;
        return function AssetLink(
            props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode },
        ) {
            const href = props.href ?? "";
            if (href.startsWith("assets/") && !href.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
                return (
                    <a
                        {...props}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none" }}
                    >
                        <span style={{ fontSize: "1.1rem" }}>📎</span>
                        <span style={{ textDecoration: "underline" }}>{props.children}</span>
                    </a>
                );
            }
            return <a {...props}>{props.children}</a>;
        };
    }, [noteId]);

    const components = useMemo(() => {
        if (!noteId) return undefined;
        const c: Record<string, React.ComponentType<Record<string, unknown>>> = {};
        if (imageComponent) c.img = imageComponent as React.ComponentType<Record<string, unknown>>;
        if (linkComponent) c.a = linkComponent as React.ComponentType<Record<string, unknown>>;
        return c;
    }, [noteId, imageComponent, linkComponent]);

    return (
        <div style={{ display: "flex", gap: "1rem", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
                <label htmlFor="md-source" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Source
                </label>
                <textarea
                    id="md-source"
                    ref={textareaRef}
                    value={raw}
                    onChange={(e) => handleChange(e.target.value)}
                    onPaste={handlePaste}
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
                {autocomplete?.active && (
                    <NoteLinkAutocomplete
                        notes={autocompleteNotes}
                        query={autocomplete.query}
                        position={autocomplete.position}
                        onSelect={handleAutocompleteSelect}
                        onCancel={handleAutocompleteCancel}
                    />
                )}
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
                    <Markdown rehypePlugins={[rehypeRaw]} components={components}>{previewContent}</Markdown>
                </div>
            </div>
        </div>
    );
}

function AssetImageLoader({
    noteId,
    assetPath,
    alt,
}: {
    noteId: string;
    assetPath: string;
    alt: string;
}) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setDataUrl(null);
        setError(false);

        // Extract the asset ID from the path: assets/{uuid}.{ext}
        const filename = assetPath.replace(/^assets\//, "");
        const assetId = filename.replace(/\.[^.]+$/, "");

        invoke<string>("read_asset_base64", { noteId, assetId })
            .then((url) => {
                if (!cancelled) setDataUrl(url);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });

        return () => {
            cancelled = true;
        };
    }, [noteId, assetPath]);

    if (error) {
        return (
            <span
                style={{
                    display: "inline-block",
                    padding: "0.5rem",
                    background: "#fee",
                    border: "1px solid #fcc",
                    borderRadius: 4,
                    color: "#c00",
                    fontSize: "0.85rem",
                }}
            >
                Image not found: {alt || assetPath}
            </span>
        );
    }

    if (!dataUrl) {
        return (
            <span style={{ display: "inline-block", padding: "0.25rem", color: "#888" }}>
                Loading image...
            </span>
        );
    }

    return <img src={dataUrl} alt={alt} style={{ maxWidth: "100%", borderRadius: 4 }} />;
}
