/**
 * E2E test helpers for the My Little Mind Map web app.
 *
 * All helper functions use WebdriverIO's global `browser` / `$` / `$$`.
 * Elements are located by `data-testid` attributes.
 *
 * ## Click pattern
 *
 * Unlike the desktop app (Tauri/WebKit), Chrome does fire events through the
 * normal DOM event pipeline when WebdriverIO calls `element.click()`.  We
 * therefore use the simpler `element.click()` approach everywhere and do NOT
 * need the `browser.execute((el) => el.click(), el)` workaround.
 *
 * ## State isolation
 *
 * The app stores its configuration and space/note data in the browser's
 * localStorage under keys prefixed with `mlmm:`.  `resetAndBootstrap()` wipes
 * those keys and refreshes the page so each suite begins from a clean state
 * without reloading the Vite dev server.
 *
 * ## Note creation
 *
 * The web UI shows a title form before creating a note (unlike the desktop app
 * which opens the editor immediately).  `createNote(title)` handles this extra
 * step and then types the Markdown heading into the editor, just as the desktop
 * helper does, so shared scenarios work identically on both platforms.
 */

import type { E2eHelpers } from '../../../../e2e-shared/helpers.js'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default autosave debounce period in the web app (seconds). */
export const AUTOSAVE_DEBOUNCE_S = 1.5

/** Timeout used for standard UI assertions (ms). */
export const UI_TIMEOUT_MS = 5_000

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

// ── Bootstrap ──────────────────────────────────────────────────────────────────

/**
 * Reset to a clean state: wipe MLMM localStorage entries, refresh, and
 * click through first-launch if shown.
 */
export async function resetAndBootstrap(): Promise<void> {
    // Wipe MLMM state from localStorage.
    await browser.execute(() => {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.startsWith('mlmm:')) keys.push(k)
        }
        keys.forEach((k) => localStorage.removeItem(k))
    })
    await browser.refresh()

    // The web app either shows first_launch (if it needs setup) or the strict
    // no-intent startup destination from the core.
    await browser.waitUntil(
        async () => {
            const screen = await $('[data-screen]')
            return screen.isExisting()
        },
        { timeout: 10_000, timeoutMsg: 'App did not render after refresh' },
    )

    const screenEl = await $('[data-screen]')
    const screenId = await screenEl.getAttribute('data-screen')
    if (screenId === 'first_launch') {
        const btn = await $('[data-testid="use-default-folder-btn"]')
        await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await btn.click()
    }
    await navigateToOverviewFromStartup()
}

async function navigateToOverviewFromStartup(): Promise<void> {
    await browser.waitUntil(
        async () => {
            const screen = await $('[data-screen]')
            return (await screen.getAttribute('data-screen').catch(() => null)) !== null
        },
        { timeout: UI_TIMEOUT_MS, timeoutMsg: 'No screen visible after bootstrap' },
    )
    const screenEl = await $('[data-screen]')
    const screenId = await screenEl.getAttribute('data-screen')
    if (screenId === 'note_editor') {
        await clickBack()
        await waitForScreen('note_list')
        await clickBack()
    } else if (screenId === 'note_list') {
        await clickBack()
    }
    await waitForScreen('overview')
}

// ── Overview helpers ───────────────────────────────────────────────────────────

/** Click one of the overview tabs by its id. */
export async function clickOverviewTab(
    tab: 'spaces' | 'labels' | 'views' | 'recent' | 'search',
): Promise<void> {
    const btn = await $(`[data-testid="tab-${tab}"]`)
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
}

/** Wait for the spaces list to be present. */
export async function waitForSpacesList(): Promise<void> {
    const list = await $('[data-testid="spaces-list"]')
    await list.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
}

// ── Space management helpers ───────────────────────────────────────────────────

/** Create a space via the overview form. */
export async function createSpace(name: string, description?: string): Promise<void> {
    const nameInput = await $('[data-testid="create-space-name"]')
    const isOpen = await nameInput.isDisplayed().catch(() => false)
    if (!isOpen) {
        const toggleBtn = await $('[data-testid="create-space-btn"]')
        await toggleBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await toggleBtn.click()
    }
    await nameInput.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await nameInput.setValue(name)

    if (description !== undefined) {
        const descInput = await $('[data-testid="create-space-description"]')
        await descInput.setValue(description)
    }

    const submitBtn = await $('[data-testid="create-space-submit"]')
    await submitBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await submitBtn.click()
}

/** Navigate into a space by clicking its list item. */
export async function navigateIntoSpace(spaceName: string): Promise<void> {
    const item = await $(`[data-testid="space-item"][data-name="${spaceName}"]`)
    await item.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await item.click()
}

/** Delete a space via its delete button. */
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

/**
 * Create a new note.
 *
 * The web UI shows a title form before opening the editor.  This helper
 * fills that form, submits it, waits for the editor, then types the Markdown
 * heading so the note gets a proper title (matching the desktop helper).
 */
export async function createNote(title: string): Promise<void> {
    const btn = await $('[data-testid="create-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()

    // Fill the title form shown by the web UI.
    const titleInput = await $('[data-testid="create-note-title-input"]')
    await titleInput.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await titleInput.setValue(title)

    const submitBtn = await $('[data-testid="create-note-submit"]')
    await submitBtn.click()

    // Wait for the editor, then type the heading to set the title in content.
    await waitForScreen('note_editor')
    const editor = await $('[data-testid="note-editor-content"]')
    await editor.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    // Use native setter so React onChange fires and dirty flag is set.
    await browser.execute((el: HTMLElement, text: string) => {
        const textarea = el as HTMLTextAreaElement
        const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            'value',
        )?.set
        nativeSetter?.call(textarea, text)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }, editor, `# ${title}\n\n`)
}

/** Type text into the search input. */
export async function searchNotes(query: string): Promise<void> {
    const input = await $('[data-testid="note-list-search"]')
    await input.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute((el: HTMLElement, text: string) => {
        const input = el as HTMLInputElement
        const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )?.set
        nativeSetter?.call(input, text)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    }, input, query)
}

/** Clear the search input. */
export async function clearSearch(): Promise<void> {
    const input = await $('[data-testid="note-list-search"]')
    await browser.execute((el: HTMLElement) => {
        const input = el as HTMLInputElement
        const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )?.set
        nativeSetter?.call(input, '')
        input.dispatchEvent(new Event('input', { bubbles: true }))
    }, input)
}

/** Return all visible note titles in the list. */
export async function visibleNoteTitles(): Promise<string[]> {
    const items = await $$('[data-testid="note-list-item"]')
    const attrs = await items.map((item) => item.getAttribute('data-title'))
    return attrs.filter((v): v is string => v !== null)
}

/** Click Back from the note list or note editor. */
export async function clickBack(): Promise<void> {
    const btn = await $('[data-testid="back-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
}

// ── Note editor helpers ────────────────────────────────────────────────────────

/** Click on a note in the note list to open the editor. */
export async function openNote(noteTitle: string): Promise<void> {
    const screenEl = await $('[data-screen]')
    const currentScreen = await screenEl.getAttribute('data-screen')
    if (currentScreen !== 'note_list') {
        await clickBack()
        await waitForScreen('note_list')
    }
    const item = await $(`[data-testid="note-list-item"][data-title="${noteTitle}"]`)
    await item.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await item.click()
    await waitForScreen('note_editor')
}

/** Type additional content in the note editor. */
export async function typeInEditor(content: string): Promise<void> {
    const editor = await $('[data-testid="note-editor-content"]')
    await editor.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await browser.execute(
        (el: HTMLElement, text: string) => {
            const textarea = el as HTMLTextAreaElement
            const nativeSetter = Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                'value',
            )?.set
            nativeSetter?.call(textarea, textarea.value + text)
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
        },
        editor,
        content,
    )
}

/** Click the Save button in the note editor. */
export async function saveNote(): Promise<void> {
    const btn = await $('[data-testid="save-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
}

/** Click the Publish button and confirm the dialog. */
export async function publishNote(): Promise<void> {
    const btn = await $('[data-testid="publish-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
    const confirmBtn = await $('[data-testid="publish-confirm-ok"]')
    await confirmBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await confirmBtn.click()
}

/** Click the Delete button in the note editor. */
export async function deleteNote(): Promise<void> {
    const btn = await $('[data-testid="delete-note-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
    // Confirm the native browser confirm() dialog triggered by the delete action.
    await browser.acceptAlert()
}

/** Add a label via the metadata panel label input. */
export async function addLabel(label: string): Promise<void> {
    const input = await $('[data-testid="metadata-label-input"]')
    await input.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await input.setValue(label)
    await browser.keys(['Enter'])
}

/** Remove a label via its chip remove button. */
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

/** Check whether the "dirty" indicator is visible. */
export async function isDirtyIndicatorVisible(): Promise<boolean> {
    const el = await $('[data-testid="dirty-indicator"]')
    return el.isDisplayed()
}

// ── Labels tab helpers ─────────────────────────────────────────────────────────

/** Click a label item in the Labels tab to activate the cross-space view. */
export async function clickLabelItem(label: string): Promise<void> {
    const item = await $(`[data-testid="label-list-item"][data-label="${label}"]`)
    await item.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await item.click()
}

// ── Error screen helpers ───────────────────────────────────────────────────────

/** Click the "Go home" button on the error screen. */
export async function goHome(): Promise<void> {
    const btn = await $('[data-testid="go-home-btn"]')
    await btn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
    await btn.click()
}

// ── E2eHelpers conformance object ─────────────────────────────────────────────

/**
 * Web implementation of E2eHelpers.
 *
 * Pass this to shared scenario functions:
 *   describe('Overview', () => runOverviewSpec(helpers))
 */
export const helpers = {
    AUTOSAVE_DEBOUNCE_S,
    UI_TIMEOUT_MS,
    resetAndBootstrap,
    waitForScreen,
    assertScreen,
    clickOverviewTab,
    waitForSpacesList,
    createSpace,
    navigateIntoSpace,
    deleteSpace,
    isSpaceVisible,
    createNote,
    openNote,
    typeInEditor,
    saveNote,
    publishNote,
    deleteNote,
    searchNotes,
    clearSearch,
    visibleNoteTitles,
    addLabel,
    removeLabel,
    visibleLabels,
    clickLabelItem,
    isDirtyIndicatorVisible,
    clickBack,
    goHome,
} satisfies E2eHelpers
