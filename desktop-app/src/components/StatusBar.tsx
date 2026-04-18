interface StatusBarProps {
    storagePath: string | null;
    noteCount: number;
    topicCount: number;
    appVersion: string | null;
}

const barStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.25rem 1rem",
    background: "#f5f5f5",
    borderTop: "1px solid #ddd",
    fontSize: "0.75rem",
    color: "#666",
    fontFamily: "system-ui, sans-serif",
    flexShrink: 0,
};

export function StatusBar({ storagePath, noteCount, topicCount, appVersion }: StatusBarProps) {
    return (
        <footer style={barStyle}>
            <span title={storagePath ?? undefined}>
                Storage: {storagePath ?? "…"}
            </span>
            <span>
                {noteCount} note{noteCount !== 1 ? "s" : ""} · {topicCount} topic{topicCount !== 1 ? "s" : ""}
            </span>
            <span>v{appVersion ?? "…"}</span>
        </footer>
    );
}
