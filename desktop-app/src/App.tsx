import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ViewModel {
    text: string;
}

function App() {
    const [view, setView] = useState<ViewModel>({ text: "" });

    useEffect(() => {
        invoke<ViewModel>("get_view").then(setView);
    }, []);

    return (
        <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
            <h1>{view.text || "My Little Mind Map"}</h1>
            <p>Desktop app ready.</p>
        </main>
    );
}

export default App;
