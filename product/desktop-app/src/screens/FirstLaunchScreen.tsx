import type { Event } from "../types";
import { openFolderDialog } from "../useApp";

interface Props {
    dispatch: (e: Event) => void;
}

export function FirstLaunchScreen({ dispatch }: Props) {
    async function handleSelect() {
        const path = await openFolderDialog();
        if (path) {
            dispatch({ type: "data_folder_selected", path });
        }
    }

    return (
        <div className="screen first-launch">
            <div className="first-launch__card">
                <h1>My Little Mind Map</h1>
                <p>Choose a folder where your notes will be stored locally.</p>
                <button className="btn btn--primary" onClick={handleSelect}>
                    Choose Data Folder…
                </button>
            </div>
        </div>
    );
}
