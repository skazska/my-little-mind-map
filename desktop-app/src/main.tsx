import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Reset default browser margins so 100vh layouts fit exactly in the viewport
Object.assign(document.documentElement.style, { height: "100%", margin: "0" });
Object.assign(document.body.style, { height: "100%", margin: "0" });
Object.assign((document.getElementById("root") as HTMLElement).style, { height: "100%" });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
