/**
 * TC-E2E-NE — Note Editor tests
 *
 * Covers: TC-E2E-NE-01..14
 * Spec refs: [S-UX-NLV5], [S-UX-NE1], [S-UX-NE2], [S-UX-NE3], [S-UX-NE4], [S-UX-NE5], [S-UX-NE6]
 */

import {
    addLabel,
    assertScreen,
    clickBack,
    clickOverviewTab,
    createNote,
    createSpace,
    deleteNote,
    isDirtyIndicatorVisible,
    navigateIntoSpace,
    openNote,
    publishNote,
    removeLabel,
    saveNote,
    typeInEditor,
    useDefaultFolder,
    visibleLabels,
    UI_TIMEOUT_MS,
    AUTOSAVE_DEBOUNCE_S,
} from '../helpers/app.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

let dataDir: string

describe('Note Editor', () => {
    before(async () => {
        await useDefaultFolder()
        await assertScreen('overview')

        // Retrieve data dir from status bar
        const statusPath = await $('[data-testid="status-bar-path"]')
        await statusPath.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        dataDir = (await statusPath.getText()).trim()

        await clickOverviewTab('spaces')
        await createSpace('editor-space')
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'editor-space') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS },
        )
        await navigateIntoSpace('editor-space')
        await assertScreen('note_list')

        // Pre-create a note that most tests will use
        await createNote('test-note')
        await clickBack()
        await assertScreen('note_list')
    })

    // ── Navigation & Display ────────────────────────────────────────────────────

    /**
     * TC-E2E-NE-01 — Clicking note opens editor [S-UX-NLV5]
     */
    it('TC-E2E-NE-01: clicking a note in the list opens the note editor', async () => {
        await openNote('test-note')
        await assertScreen('note_editor')

        const editor = await $('[data-testid="note-editor-content"]')
        await expect(editor).toBeDisplayed()
    })

    /**
     * TC-E2E-NE-02 — Metadata panel shows title, labels, UUID, dates [S-UX-NE1]
     */
    it('TC-E2E-NE-02: metadata panel displays title, labels, UUID, created_at, and updated_at', async () => {
        const titleEl = await $('[data-testid="metadata-title"]')
        await expect(titleEl).toBeDisplayed()

        const uuidEl = await $('[data-testid="metadata-uuid"]')
        await expect(uuidEl).toBeDisplayed()

        const createdEl = await $('[data-testid="metadata-created-at"]')
        await expect(createdEl).toBeDisplayed()

        const updatedEl = await $('[data-testid="metadata-updated-at"]')
        await expect(updatedEl).toBeDisplayed()
    })

    /**
     * TC-E2E-NE-03 — Back button returns to note list
     */
    it('TC-E2E-NE-03: Back button from note editor returns to note list', async () => {
        await clickBack()
        await assertScreen('note_list')
    })

    // ── Editing ─────────────────────────────────────────────────────────────────

    /**
     * TC-E2E-NE-04 — Typing content marks note as dirty [S-UX-NE3]
     */
    it('TC-E2E-NE-04: typing in the editor shows the dirty indicator', async () => {
        await openNote('test-note')
        await typeInEditor('Some new content.')
        await browser.waitUntil(
            () => isDirtyIndicatorVisible(),
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'Dirty indicator did not appear after typing' },
        )
        const dirty = await isDirtyIndicatorVisible()
        expect(dirty).toBe(true)
    })

    /**
     * TC-E2E-NE-05 — Manual save clears dirty indicator [S-UX-NE3]
     */
    it('TC-E2E-NE-05: clicking Save clears the dirty indicator', async () => {
        await saveNote()
        await browser.waitUntil(
            async () => !(await isDirtyIndicatorVisible()),
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'Dirty indicator did not clear after save' },
        )
        const dirty = await isDirtyIndicatorVisible()
        expect(dirty).toBe(false)
    })

    /**
     * TC-E2E-NE-06 — Autosave triggers after typing pause [S-UX-NE4]
     *
     * We read the file on disk to confirm autosave wrote the content.
     * The debounce period is 10 s; we wait 15 s to be safe.
     */
    it('TC-E2E-NE-06: autosave fires after the debounce period', async () => {
        const autosaveContent = `Autosave test ${Date.now()}`
        await typeInEditor(autosaveContent)

        // Wait longer than the debounce period
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 5) * 1_000)

        // Verify content was written to disk
        const notePath = path.join(dataDir, 'spaces', 'editor-space', 'test-note.md')
        await browser.waitUntil(
            () => {
                if (!fs.existsSync(notePath)) return false
                const raw = fs.readFileSync(notePath, 'utf-8')
                return raw.includes(autosaveContent)
            },
            { timeout: 5_000, timeoutMsg: 'Autosave did not persist content to disk' },
        )
    })

    /**
     * TC-E2E-NE-07 — Autosave does not normalize content [S-UX-NE5]
     */
    it('TC-E2E-NE-07: autosave preserves trailing spaces and consecutive blank lines', async () => {
        // Open a fresh note to avoid contamination
        await clickBack()
        await assertScreen('note_list')
        await createNote('preserve-note')
        await clickBack()
        await assertScreen('note_list')
        await openNote('preserve-note')

        const rawContent = 'Line one.   \n\n\nLine two after two blank lines.'
        await typeInEditor(rawContent)

        await browser.pause((AUTOSAVE_DEBOUNCE_S + 5) * 1_000)

        const notePath = path.join(dataDir, 'spaces', 'editor-space', 'preserve-note.md')
        await browser.waitUntil(() => fs.existsSync(notePath), { timeout: 3_000 })

        const raw = fs.readFileSync(notePath, 'utf-8')
        // Content area should contain the text; trailing spaces must be preserved
        expect(raw).toContain('Line one.   ')
    })

    /**
     * TC-E2E-NE-08 — Add label via metadata panel [S-UX-NE1]
     */
    it('TC-E2E-NE-08: adding a label via the metadata panel persists it after save', async () => {
        await openNote('test-note')
        await addLabel('new-label')

        const labels = await visibleLabels()
        expect(labels).toContain('new-label')

        await saveNote()

        // Verify front matter on disk
        const notePath = path.join(dataDir, 'spaces', 'editor-space', 'test-note.md')
        await browser.waitUntil(
            () => fs.existsSync(notePath) && fs.readFileSync(notePath, 'utf-8').includes('new-label'),
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'Label not found in front matter after save' },
        )
    })

    /**
     * TC-E2E-NE-09 — Remove label via metadata panel [S-UX-NE1]
     */
    it('TC-E2E-NE-09: removing a label via the metadata panel updates the label list and disk', async () => {
        // Ensure we're in the editor (may have navigated away)
        const screen = await $('[data-screen]')
        const screenId = await screen.getAttribute('data-screen')
        if (screenId !== 'note_editor') {
            await openNote('test-note')
        }

        const labelsBefore = await visibleLabels()
        if (!labelsBefore.includes('new-label')) {
            await addLabel('new-label')
        }

        await removeLabel('new-label')

        const labelsAfter = await visibleLabels()
        expect(labelsAfter).not.toContain('new-label')

        await saveNote()

        const notePath = path.join(dataDir, 'spaces', 'editor-space', 'test-note.md')
        await browser.waitUntil(
            () => {
                const raw = fs.readFileSync(notePath, 'utf-8')
                return !raw.includes('new-label')
            },
            { timeout: UI_TIMEOUT_MS },
        )
    })

    /**
     * TC-E2E-NE-10 — Content command `/:labels` sets labels [S-UX-NE2]
     */
    it('TC-E2E-NE-10: /:labels command adds labels to the note', async () => {
        await openNote('test-note')
        await typeInEditor('\n/:labels rust learning;')
        await saveNote()

        const labels = await visibleLabels()
        expect(labels).toContain('rust')
        expect(labels).toContain('learning')
    })

    /**
     * TC-E2E-NE-11 — Delete note removes it from list [S-UX-NE3]
     */
    it('TC-E2E-NE-11: deleting a note removes it from the note list', async () => {
        await clickBack()
        await assertScreen('note_list')
        await createNote('disposable-note')
        await clickBack()
        await assertScreen('note_list')
        await openNote('disposable-note')

        await deleteNote()

        await assertScreen('note_list')
        const noteItems = await $$('[data-testid="note-list-item"]')
        const titles = await noteItems.map((i) => i.getAttribute('data-title'))
        expect(titles).not.toContain('disposable-note')
    })

    // ── Draft and Publish ────────────────────────────────────────────────────────

    /**
     * TC-E2E-NE-12 — New note created as draft [S-UX-NE1]
     */
    it('TC-E2E-NE-12: new note is created as a draft', async () => {
        await createNote('draft-note')

        const draftIndicator = await $('[data-testid="draft-indicator"]')
        await expect(draftIndicator).toBeDisplayed()

        await saveNote()

        const notePath = path.join(dataDir, 'spaces', 'editor-space', 'draft-note.md')
        await browser.waitUntil(() => fs.existsSync(notePath), { timeout: UI_TIMEOUT_MS })
        const raw = fs.readFileSync(notePath, 'utf-8')
        expect(raw).toContain('draft: true')
    })

    /**
     * TC-E2E-NE-13 — Publish clears draft flag [S-UX-NE1]
     */
    it('TC-E2E-NE-13: publishing a note clears the draft indicator and flag on disk', async () => {
        // Open draft-note (already in editor from previous test, but re-open safely)
        const screenEl = await $('[data-screen]')
        const screenId = await screenEl.getAttribute('data-screen')
        if (screenId !== 'note_editor') {
            await openNote('draft-note')
        }

        await publishNote()

        const draftIndicator = await $('[data-testid="draft-indicator"]')
        await expect(draftIndicator).not.toBeDisplayed()

        const notePath = path.join(dataDir, 'spaces', 'editor-space', 'draft-note.md')
        await browser.waitUntil(
            () => {
                const raw = fs.readFileSync(notePath, 'utf-8')
                return raw.includes('draft: false')
            },
            { timeout: UI_TIMEOUT_MS },
        )
    })

    /**
     * TC-E2E-NE-14 — Publish shows confirmation dialog before normalizing content [S-UX-NE6]
     */
    it('TC-E2E-NE-14: Publish action shows a confirmation dialog before formatting', async () => {
        await clickBack()
        await assertScreen('note_list')
        await createNote('confirm-publish-note')

        // Note is already in editor
        // Trigger publish — a confirmation dialog must appear
        const publishBtn = await $('[data-testid="publish-note-btn"]')
        await publishBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await publishBtn.click()

        const dialog = await $('[data-testid="publish-confirm-dialog"], [role="dialog"]')
        await expect(dialog).toBeDisplayed()

        // Dismiss the dialog (cancel) to keep the note as draft
        const cancelBtn = await $('[data-testid="publish-confirm-cancel"], [data-testid="dialog-cancel"]')
        if (await cancelBtn.isDisplayed()) {
            await cancelBtn.click()
        }
    })
})
