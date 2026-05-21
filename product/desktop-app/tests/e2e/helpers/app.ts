/**
 * E2E test helpers for interacting with the My Little Mind Map desktop app.
 *
 * All helper functions use WebdriverIO's global `browser` / `$` / `$$`.
 * Elements are located by `data-testid` attributes (WDIO selector `[data-testid="…"]`).
 *
 * `data-testid` values used here must be present in the frontend components.
 *
 * ## Click pattern
 *
 * All interactive clicks use `browser.execute((el) => el.click(), element)` rather
 * than the WebdriverIO `element.click()` shorthand.  The reason: WebDriver's
 * synthesised click command (HTTP POST /element/:id/click) does NOT fire through
 * the browser's normal event path in Tauri/WebKit on Linux.  React's synthetic
 * event system uses delegated listeners on the document root, so events that
 * bypass the real DOM event pipeline are invisible to React handlers and no
 * state transition occurs.  Calling `.click()` directly on the DOM node from
 * within the page context (`browser.execute`) fires a real, trusted Event that
 * React's delegation picks up correctly.
 *
 * ## App config isolation
 *
 * `wdio.conf.ts` spawns `tauri-driver` with a fresh `XDG_CONFIG_HOME` temp dir
 * (set as `E2E_XDG_CONFIG_HOME` in the Node process env).  This prevents any
 * real user config (`~/.config/com.my-little-mind-map.desktop/config.json`) from
 * leaking into the test run and causing the app to skip the first-launch screen.
 * `resetAppState()` deletes the config file within that dir so individual tests
 * can start from a clean state without restarting the process.
 */

import * as os from 'node:os'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default autosave debounce period in the app (seconds). */
export const AUTOSAVE_DEBOUNCE_S = 10

/** Timeout used for standard UI assertions (ms). */
export const UI_TIMEOUT_MS = 5_000

// ── Data directory management ─────────────────────────────────────────────────

/** Create a fresh temporary directory for one E2E test suite. */
export function createTempDataDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'mlmm-e2e-'))
}

/** Remove a temporary directory created by {@link createTempDataDir}. */
export function removeTempDataDir(dir: string): void {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
}

// ── Screen helpers ─────────────────────────────────────────────────────────────

/** Wait for a specific screen to become visible. */
export async function waitForScreen(
    screenId: 'first_launch' | 'overview' | 'note_list' | 'note_editor' | 'error',
    timeout = UI_TIMEOUT_MS,
): Promise<void> {
    const el = await $(`[data-screen="${screenId}"]`)
    await el.waitForDisplayed({ timeout, timeoutMsg: `Screen "${screenId}" not visible within ${timeout}ms` })
}

/** Assert the current visible screen matches `screenId`. */
export async function assertScreen(
    screenId: 'first_launch' | 'overview' | 'note_list' | 'note_editor' | 'error',
): Promise<void> {
    await waitForScreen(screenId)
}

// ── First launch helpers ───────────────────────────────────────────────────────

/**
 * Reset the app to the first-launch screen.
 *
 * Deletes the app config file from the isolated E2E XDG config home (so
 * `get_data_folder_config` returns null), then refreshes the WebView to
 * trigger a fresh `app_started` dispatch with no `data_folder`.  Must be
 * called in `beforeEach` for every test that needs a clean first-launch state.
 */
export async function resetAppState(): Promise<void> {
    const xdgConfigHome = process.env['E2E_XDG_CONFIG_HOME']
    if (xdgConfigHome) {
        const configFile = path.join(
            xdgConfigHome,
            'com.my-little-mind-map.desktop',
            'config.json',
        )
        if (fs.existsSync(configFile)) {
            fs.rmSync(configFile)
        }
    }
    // Clean the default data directory so notes from previous runs don't leak.
    const defaultDataDir = path.join(os.homedir(), 'MyLittleMindMapData')
    if (fs.existsSync(defaultDataDir)) {
        fs.rmSync(defaultDataDir, { recursive: true, force: true })
    }
    await browser.refresh()
    await waitForScreen('first_launch')
}

/** Click "Use default folder" on the first launch screen. */
export async function useDefaultFolder(): Promise<void> {
    const btn = await $('[data-testid="use-default-folder-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), btn)
}

// ── Overview helpers ───────────────────────────────────────────────────────────

/** Click a named tab in the overview screen. */
export async function clickOverviewTab(
    tab: 'spaces' | 'labels' | 'views' | 'recent' | 'search',
): Promise<void> {
    const el = await $(`[data-testid="tab-${tab}"]`)
    await el.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((domEl) => (domEl as HTMLElement).click(), el)
}

/** Wait for the spaces list to be visible. */
export async function waitForSpacesList(): Promise<void> {
    const list = await $('[data-testid="spaces-list"]')
    await list.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
}

// ── Space management helpers ───────────────────────────────────────────────────

/** Create a space via the overview form. */
export async function createSpace(name: string, description?: string): Promise<void> {
    // Open the creation form if it is not already visible.
    const nameInput = await $('[data-testid="create-space-name"]')
    const isOpen = await nameInput.isDisplayed().catch(() => false)
    if (!isOpen) {
        const toggleBtn = await $('[data-testid="create-space-btn"]')
        await toggleBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await browser.execute((el) => (el as HTMLElement).click(), toggleBtn)
    }
    await nameInput.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await nameInput.setValue(name)

    if (description !== undefined) {
        const descInput = await $('[data-testid="create-space-description"]')
        await descInput.setValue(description)
    }

    const submitBtn = await $('[data-testid="create-space-submit"]')
    await submitBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), submitBtn)
}

/** Navigate into a space by clicking its list item. */
export async function navigateIntoSpace(spaceName: string): Promise<void> {
    const item = await $(`[data-testid="space-item"][data-name="${spaceName}"]`)
    await item.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), item)
}

/** Delete a space via its list item action button. */
export async function deleteSpace(spaceName: string): Promise<void> {
    const deleteBtn = await $(
        `[data-testid="space-item"][data-name="${spaceName}"] [data-testid="delete-space-btn"]`,
    )
    await deleteBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), deleteBtn)
}

/** Check whether a space appears in the spaces list. */
export async function isSpaceVisible(spaceName: string): Promise<boolean> {
    const items = await $$('[data-testid="space-item"]')
    for (const item of items) {
        const name = await item.getAttribute('data-name')
        if (name === spaceName) return true
    }
    return false
}

// ── Note list helpers ──────────────────────────────────────────────────────────

/** Create a new note from the note list screen. */
export async function createNote(title: string): Promise<void> {
    const btn = await $('[data-testid="create-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), btn)
    // The editor opens; wait for it, then type the title as the first heading.
    await waitForScreen('note_editor')
    const editor = await $('[data-testid="note-editor-content"]')
    await editor.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    // Use native setter so React onChange fires and dirty flag is set.
    await browser.execute((el: HTMLTextAreaElement, text: string) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            'value',
        )?.set
        nativeSetter?.call(el, text)
        el.dispatchEvent(new Event('input', { bubbles: true }))
    }, editor, `# ${title}\n\n`)
}

/** Type text into the search input on the note list. */
export async function searchNotes(query: string): Promise<void> {
    const input = await $('[data-testid="note-list-search"]')
    await input.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el: HTMLInputElement, text: string) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )?.set
        nativeSetter?.call(el, text)
        el.dispatchEvent(new Event('input', { bubbles: true }))
    }, input, query)
}

/** Clear the search input. */
export async function clearSearch(): Promise<void> {
    const input = await $('[data-testid="note-list-search"]')
    await browser.execute((el: HTMLInputElement) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )?.set
        nativeSetter?.call(el, '')
        el.dispatchEvent(new Event('input', { bubbles: true }))
    }, input)
}

/** Return all visible note titles in the list. */
export async function visibleNoteTitles(): Promise<string[]> {
    const items = await $$('[data-testid="note-list-item"]')
    const attrs = await items.map((item) => item.getAttribute('data-title'))
    return attrs.filter((v): v is string => v !== null)
}

/** Click Back from the note list. */
export async function clickBack(): Promise<void> {
    const btn = await $('[data-testid="back-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), btn)
}

// ── Note editor helpers ────────────────────────────────────────────────────────

/** Click on a note in the note list to open the editor. */
export async function openNote(noteTitle: string): Promise<void> {
    // If we're not on note_list, navigate back first
    const screenEl = await $('[data-screen]')
    const currentScreen = await screenEl.getAttribute('data-screen')
    if (currentScreen !== 'note_list') {
        await clickBack()
        await waitForScreen('note_list')
    }
    const item = await $(`[data-testid="note-list-item"][data-title="${noteTitle}"]`)
    await item.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), item)
    await waitForScreen('note_editor')
}

/** Type content in the note editor content area. */
export async function typeInEditor(content: string): Promise<void> {
    const editor = await $('[data-testid="note-editor-content"]')
    await editor.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute(
        (el: HTMLTextAreaElement, text: string) => {
            const nativeSetter = Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                'value',
            )?.set
            nativeSetter?.call(el, el.value + text)
            el.dispatchEvent(new Event('input', { bubbles: true }))
        },
        editor,
        content,
    )
}

/** Click the Save button in the note editor. */
export async function saveNote(): Promise<void> {
    const btn = await $('[data-testid="save-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), btn)
}

/** Click the Publish button in the note editor and confirm the dialog. */
export async function publishNote(): Promise<void> {
    const btn = await $('[data-testid="publish-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), btn)
    // Confirm the publish dialog.
    const confirmBtn = await $('[data-testid="publish-confirm-ok"]')
    await confirmBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), confirmBtn)
}

/** Click the Delete button in the note editor. */
export async function deleteNote(): Promise<void> {
    const btn = await $('[data-testid="delete-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), btn)
}

/** Add a label via the metadata panel label input. */
export async function addLabel(label: string): Promise<void> {
    const input = await $('[data-testid="metadata-label-input"]')
    await input.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await input.setValue(label)
    await browser.keys(['Enter'])
}

/** Remove a label via the metadata panel. */
export async function removeLabel(label: string): Promise<void> {
    const removeBtn = await $(
        `[data-testid="label-chip"][data-label="${label}"] [data-testid="label-remove-btn"]`,
    )
    await removeBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), removeBtn)
}

/** Return all visible label names in the metadata panel. */
export async function visibleLabels(): Promise<string[]> {
    const chips = await $$('[data-testid="label-chip"]')
    const attrs = await chips.map((c) => c.getAttribute('data-label'))
    return attrs.filter((v): v is string => v !== null)
}

/** Check whether the "dirty" (unsaved changes) indicator is visible. */
export async function isDirtyIndicatorVisible(): Promise<boolean> {
    const el = await $('[data-testid="dirty-indicator"]')
    return el.isDisplayed()
}

// ── Status bar helpers ─────────────────────────────────────────────────────────

/** Return the data folder path shown in the status bar. */
export async function getStatusBarPath(): Promise<string> {
    const el = await $('[data-testid="status-bar-path"]')
    await el.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    return el.getText()
}

// ── Error screen helpers ───────────────────────────────────────────────────────

/** Click the "Go home" button on the error screen. */
export async function goHome(): Promise<void> {
    const btn = await $('[data-testid="go-home-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el) => (el as HTMLElement).click(), btn)
}
