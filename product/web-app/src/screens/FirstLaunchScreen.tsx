import type { Event } from "../types";

interface Props {
    dispatch: (e: Event) => void;
}

// In the web app, storage is handled via localStorage automatically.
// This screen should not normally appear (AppStarted always sends "browser" as
// the data_folder), but is kept as a safety net.
export function FirstLaunchScreen({ dispatch }: Props) {
    return (
        <div className="screen first-launch">
            <div className="first-launch__card">
                <h1>My Little Mind Map</h1>
                <p>Your notes will be stored in this browser's local storage.</p>
                <button
                    className="btn btn--primary"
                    onClick={() => dispatch({ type: "data_folder_selected", path: "browser" })}
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}
