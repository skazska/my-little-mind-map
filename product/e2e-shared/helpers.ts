/**
 * Platform-agnostic E2E helper interface.
 *
 * Each platform (desktop, web) provides a concrete object satisfying this
 * interface. Shared scenario functions receive an `E2eHelpers` instance and
 * use it exclusively — no direct `browser` / DOM manipulation.
 *
 * Shared scenario files may still use wdio globals (`$`, `$$`,
 * `browser.waitUntil`, `expect`, `it`, `before`, `beforeEach`) for
 * assertions and test lifecycle — those APIs are identical on all platforms.
 *
 * ## Implementation notes for platform helpers
 *
 * ### Desktop (Tauri/WebKit)
 * - Clicks must use `browser.execute((el) => el.click(), el)` because
 *   WebDriver's synthesised click does not propagate through React's event
 *   delegation on Tauri/WebKit on Linux.
 * - `createNote(title)`: click create btn → editor opens → native-setter
 *   `# title\n\n` in the textarea.
 * - `resetAndBootstrap()`: delete XDG config file + refresh + useDefaultFolder.
 * - `AUTOSAVE_DEBOUNCE_S`: 10.
 *
 * ### Web (Chrome/Vite)
 * - Regular `element.click()` works fine (real Chrome).
 * - `createNote(title)`: click create btn → form → type title → submit →
 *   editor opens → native-setter `# title\n\n` in the textarea.
 * - `resetAndBootstrap()`: clear `mlmm:` localStorage keys + refresh +
 *   waitForScreen('overview').
 * - `AUTOSAVE_DEBOUNCE_S`: 1.5.
 */

export type ScreenId =
    | 'first_launch'
    | 'overview'
    | 'note_list'
    | 'note_editor'
    | 'error'

export type OverviewTab = 'spaces' | 'labels' | 'views' | 'recent' | 'search'

export interface E2eHelpers {
    // ── Constants ────────────────────────────────────────────────────────────

    /** Autosave debounce in seconds (platform-specific). */
    readonly AUTOSAVE_DEBOUNCE_S: number

    /** Standard UI wait timeout in milliseconds. */
    readonly UI_TIMEOUT_MS: number

    // ── Bootstrap ────────────────────────────────────────────────────────────

    /**
     * Reset all stored state and bring the app to the overview screen.
     *
     * On desktop: delete the config file from the isolated XDG dir, refresh
     *   the WebView, click "Use default folder".
     * On web: remove all `mlmm:` keys from localStorage, refresh, wait for
     *   the overview screen (app skips first-launch for browser storage).
     */
    resetAndBootstrap(): Promise<void>

    // ── Screen ───────────────────────────────────────────────────────────────

    waitForScreen(screenId: ScreenId, timeout?: number): Promise<void>
    assertScreen(screenId: ScreenId): Promise<void>

    // ── Overview ─────────────────────────────────────────────────────────────

    clickOverviewTab(tab: OverviewTab): Promise<void>
    waitForSpacesList(): Promise<void>

    // ── Spaces ───────────────────────────────────────────────────────────────

    createSpace(name: string, description?: string): Promise<void>
    navigateIntoSpace(spaceName: string): Promise<void>
    deleteSpace(spaceName: string): Promise<void>
    isSpaceVisible(spaceName: string): Promise<boolean>

    /**
     * Create a nested child space under `parentName` via its per-row
     * "+ Child" action, then submit the creation form for `childName`.
     */
    createChildSpace(parentName: string, childName: string, description?: string): Promise<void>

    /**
     * Indentation depth of a space row in the spaces tree (`data-depth`).
     * Returns `null` when the space is not present.
     */
    spaceDepth(spaceName: string): Promise<number | null>

    // ── Notes ────────────────────────────────────────────────────────────────

    /**
     * Create a new note. Lands in the note editor with `# title\n\n` typed
     * as the first heading. The note is unsaved (dirty) — clicking back will
     * trigger save-on-navigation and the note will appear in the list.
     */
    createNote(title: string): Promise<void>
    openNote(noteTitle: string): Promise<void>
    typeInEditor(content: string): Promise<void>
    saveNote(): Promise<void>

    /**
     * Create a nested child note under the note `parentTitle` via its per-row
     * "+ Subnote" action, landing in the editor with `# childTitle` typed.
     */
    createChildNote(parentTitle: string, childTitle: string): Promise<void>

    /**
     * Indentation depth of a note row in the note tree (`data-depth`).
     * Returns `null` when the note is not present.
     */
    noteDepth(noteTitle: string): Promise<number | null>

    /**
     * Click the Publish button and confirm the action (platform-specific:
     * custom React dialog on desktop, no-op/auto-confirm on web).
     */
    publishNote(): Promise<void>
    deleteNote(): Promise<void>

    // ── Search ───────────────────────────────────────────────────────────────

    searchNotes(query: string): Promise<void>
    clearSearch(): Promise<void>
    visibleNoteTitles(): Promise<string[]>

    // ── Labels ───────────────────────────────────────────────────────────────

    addLabel(label: string): Promise<void>
    removeLabel(label: string): Promise<void>
    visibleLabels(): Promise<string[]>

    /**
     * Click a label item in the Labels tab to activate a cross-space view.
     * Abstracted because desktop requires the `browser.execute` click workaround.
     */
    clickLabelItem(label: string): Promise<void>

    // ── State indicators ─────────────────────────────────────────────────────

    isDirtyIndicatorVisible(): Promise<boolean>
    clickBack(): Promise<void>
    goHome(): Promise<void>
}
