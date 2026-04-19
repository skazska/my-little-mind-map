import { useState, useEffect, useRef, useCallback } from "react";
import type { NoteView } from "../types";

export interface NoteLinkAutocompleteProps {
    notes: NoteView[];
    query: string;
    position: { top: number; left: number };
    onSelect: (noteId: string, noteTitle: string) => void;
    onCancel: () => void;
}

export function NoteLinkAutocomplete({
    notes,
    query,
    position,
    onSelect,
    onCancel,
}: NoteLinkAutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = notes.filter((n) =>
        n.title.toLowerCase().includes(query.toLowerCase()),
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keep selection within bounds when results change
    useEffect(() => {
        setSelectedIndex((prev) => {
            if (filtered.length === 0) return 0;
            return Math.min(Math.max(prev, 0), filtered.length - 1);
        });
    }, [filtered.length]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (filtered.length === 0) return;
                setSelectedIndex((prev) => Math.min(Math.max(prev + 1, 0), filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length > 0 && selectedIndex >= 0 && selectedIndex < filtered.length) {
                    const note = filtered[selectedIndex];
                    onSelect(note.id, note.title);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                onCancel();
            }
        },
        [filtered, selectedIndex, onSelect, onCancel],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [handleKeyDown]);

    // Click outside to cancel
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onCancel();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onCancel]);

    if (filtered.length === 0) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "fixed",
                    top: position.top,
                    left: position.left,
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: "0.5rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    maxWidth: 300,
                    fontSize: "0.85rem",
                    color: "#888",
                }}
            >
                No matching notes
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: 1000,
                maxWidth: 350,
                maxHeight: 250,
                overflowY: "auto",
            }}
        >
            {filtered.slice(0, 20).map((note, idx) => (
                <div
                    key={note.id}
                    onClick={() => onSelect(note.id, note.title)}
                    style={{
                        padding: "0.4rem 0.6rem",
                        cursor: "pointer",
                        background: idx === selectedIndex ? "#e8f0fe" : "transparent",
                        borderBottom: idx < filtered.length - 1 ? "1px solid #eee" : "none",
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                >
                    <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{note.title}</div>
                    {note.topic_names.length > 0 && (
                        <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.1rem" }}>
                            {note.topic_names[0]}
                            {note.topic_names.length > 1 && ` +${note.topic_names.length - 1}`}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
