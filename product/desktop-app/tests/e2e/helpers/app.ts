/**
 * E2E test helpers for interacting with the My Little Mind Map desktop app.
 *
 * All helper functions use WebdriverIO's global `browser` / `$` / `$$`.
 * Elements are located by `data-testid` attributes (WDIO selector `[data-testid="…"]`).
 *
 * `data-testid` values used here must be present in the frontend components.
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

/** Click "Use default folder" on the first launch screen. */
export async function useDefaultFolder(): Promise<void> {
    const btn = await $('[data-testid="use-default-folder-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
}

// ── Overview helpers ───────────────────────────────────────────────────────────

/** Click a named tab in the overview screen. */
export async function clickOverviewTab(
    tab: 'spaces' | 'labels' | 'views' | 'recent' | 'search',
): Promise<void> {
    const el = await $(`[data-testid="tab-${tab}"]`)
    await el.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await el.click()
}

/** Wait for the spaces list to be visible. */
export async function waitForSpacesList(): Promise<void> {
    const list = await $('[data-testid="spaces-list"]')
    await list.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
}

// ── Space management helpers ───────────────────────────────────────────────────

/** Create a space via the overview form. */
export async function createSpace(name: string, description?: string): Promise<void> {
    const nameInput = await $('[data-testid="create-space-name"]')
    await nameInput.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await nameInput.setValue(name)

    if (description !== undefined) {
        const descInput = await $('[data-testid="create-space-description"]')
        await descInput.setValue(description)
    }

    const submitBtn = await $('[data-testid="create-space-submit"]')
    await submitBtn.click()
}

/** Navigate into a space by clicking its list item. */
export async function navigateIntoSpace(spaceName: string): Promise<void> {
    const item = await $(`[data-testid="space-item"][data-name="${spaceName}"]`)
    await item.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await item.click()
}

/** Delete a space via its list item action button. */
export async function deleteSpace(spaceName: string): Promise<void> {
    const deleteBtn = await $(
        `[data-testid="space-item"][data-name="${spaceName}"] [data-testid="delete-space-btn"]`,
    )
    await deleteBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await deleteBtn.click()
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
    await btn.click()
    // The editor opens; wait for it, then type the title as the first heading.
    await waitForScreen('note_editor')
    const editor = await $('[data-testid="note-editor-content"]')
    await editor.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await editor.setValue(`# ${title}\n\n`)
}

/** Type text into the search input on the note list. */
export async function searchNotes(query: string): Promise<void> {
    const input = await $('[data-testid="note-list-search"]')
    await input.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await input.setValue(query)
}

/** Clear the search input. */
export async function clearSearch(): Promise<void> {
    const input = await $('[data-testid="note-list-search"]')
    await input.clearValue()
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
    await btn.click()
}

// ── Note editor helpers ────────────────────────────────────────────────────────

/** Click on a note in the note list to open the editor. */
export async function openNote(noteTitle: string): Promise<void> {
    const item = await $(`[data-testid="note-list-item"][data-title="${noteTitle}"]`)
    await item.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await item.click()
    await waitForScreen('note_editor')
}

/** Type content in the note editor content area. */
export async function typeInEditor(content: string): Promise<void> {
    const editor = await $('[data-testid="note-editor-content"]')
    await editor.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await editor.addValue(content)
}

/** Click the Save button in the note editor. */
export async function saveNote(): Promise<void> {
    const btn = await $('[data-testid="save-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
}

/** Click the Publish button in the note editor. */
export async function publishNote(): Promise<void> {
    const btn = await $('[data-testid="publish-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
}

/** Click the Delete button in the note editor. */
export async function deleteNote(): Promise<void> {
    const btn = await $('[data-testid="delete-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
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
    await removeBtn.click()
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
    await btn.click()
}
