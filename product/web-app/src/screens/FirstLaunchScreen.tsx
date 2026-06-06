import type { Event } from "../types";

interface Props {
    dispatch: (e: Event) => void;
}

// In the web app, storage is handled via the browser-local S-ST-LS3 file tree.
// This screen should not normally appear (AppStarted always sends "browser" as
// the data_folder), but is kept as a safety net.
export function FirstLaunchScreen({ dispatch }: Props) {
    return (
        <div className="screen first-launch" data-screen="first_launch">
            <div className="first-launch__card">
                <h1>My Little Mind Map</h1>
                <p>Your notes will be stored in a browser-local folder-note store.</p>
                <button
                    className="btn btn--primary"
                    data-testid="use-default-folder-btn"
                    onClick={() => dispatch({ type: "data_folder_selected", path: "browser" })}
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}
