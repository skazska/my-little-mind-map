import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { BacklinkItem } from "../types";

export interface BacklinksPanelProps {
    noteId: string;
    onNavigateToNote: (noteId: string) => void;
}

export function BacklinksPanel({ noteId, onNavigateToNote }: BacklinksPanelProps) {
    const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        invoke<BacklinkItem[]>("get_note_backlinks", { noteId })
            .then((items) => {
                if (!cancelled) {
                    setBacklinks(items);
                    setLoading(false);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(String(e));
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [noteId]);

    if (loading) {
        return (
            <div style={{ padding: "0.5rem", color: "#888", fontSize: "0.85rem" }}>
                Loading backlinks...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "0.5rem", color: "#c00", fontSize: "0.85rem" }}>
                Failed to load backlinks: {error}
            </div>
        );
    }

    return (
        <div style={{ borderTop: "1px solid #ddd", paddingTop: "0.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600 }}>
                Backlinks ({backlinks.length})
            </h3>
            {backlinks.length === 0 ? (
                <p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>No backlinks</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {backlinks.map((bl) => (
                        <li
                            key={bl.source_note_id}
                            style={{
                                padding: "0.4rem 0.5rem",
                                marginBottom: "0.25rem",
                                background: bl.is_broken ? "#fff5f5" : "#f8f9fa",
                                borderRadius: 4,
                                border: bl.is_broken ? "1px solid #fcc" : "1px solid #eee",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                {bl.is_broken && (
                                    <span title="Source note was deleted" style={{ color: "#c00" }}>⚠</span>
                                )}
                                <button
                                    onClick={() => !bl.is_broken && onNavigateToNote(bl.source_note_id)}
                                    disabled={bl.is_broken}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        color: bl.is_broken ? "#999" : "#1a73e8",
                                        textDecoration: bl.is_broken ? "line-through" : "underline",
                                        cursor: bl.is_broken ? "default" : "pointer",
                                        fontWeight: 500,
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    {bl.source_note_title}
                                </button>
                            </div>
                            {bl.context_text && (
                                <div
                                    style={{
                                        fontSize: "0.8rem",
                                        color: "#666",
                                        marginTop: "0.2rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {bl.context_text}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
