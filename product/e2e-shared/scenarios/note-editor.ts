/**
 * Shared E2E scenario: Note Editor
 *
 * Covers: TC-E2E-NE-01, 03–05, 08–13
 *
 * Excluded from shared (platform-specific):
 *   TC-E2E-NE-02  Full metadata panel (uuid/dates only on desktop ViewModel)
 *   TC-E2E-NE-06  Autosave verification (disk on desktop, localStorage on web)
 *   TC-E2E-NE-07  Content-preservation check (requires storage read)
 *   TC-E2E-NE-14  Publish confirmation dialog (custom React dialog vs native confirm())
 *
 * Spec refs: [S-UX-NVT2], [S-UX-NE1], [S-UX-NE2], [S-UX-NE3], [S-UX-NE4]
 *
 * Call inside a `describe('Note Editor', ...)` block.
 * Wrapper's `before()` should:
 *   1. Call h.resetAndBootstrap()
 *   2. Create a space called 'editor-space' and navigate into it
 *   3. Create a note called 'test-note' then h.clickBack()
 *
 *   describe('Note Editor', () => runNoteEditorSpec(h))
 */

import type { E2eHelpers } from '../helpers.js'

export function runNoteEditorSpec(h: E2eHelpers): void {
    // ── Navigation & Display ─────────────────────────────────────────────────

    /**
     * TC-E2E-NE-01 — Clicking note opens editor [S-UX-NVT2]
     */
    it('TC-E2E-NE-01: clicking a note in the list opens the note editor', async () => {
        await h.openNote('test-note')
        await h.assertScreen('note_editor')

        const editor = await $('[data-testid="note-editor-content"]')
        await expect(editor).toBeDisplayed()
    })

    /**
     * TC-E2E-NE-03 — Back button returns to note list
     */
    it('TC-E2E-NE-03: Back button from note editor returns to note list', async () => {
        await h.clickBack()
        await h.assertScreen('note_list')
    })

    // ── Editing ──────────────────────────────────────────────────────────────

    /**
     * TC-E2E-NE-04 — Typing content marks note as dirty [S-UX-NE3]
     */
    it('TC-E2E-NE-04: typing in the editor shows the dirty indicator', async () => {
        await h.openNote('test-note')
        await h.typeInEditor('Some new content.')
        await browser.waitUntil(
            () => h.isDirtyIndicatorVisible(),
            { timeout: h.UI_TIMEOUT_MS, timeoutMsg: 'Dirty indicator did not appear after typing' },
        )
        const dirty = await h.isDirtyIndicatorVisible()
        expect(dirty).toBe(true)
    })

    /**
     * TC-E2E-NE-05 — Manual save clears dirty indicator [S-UX-NE3]
     */
    it('TC-E2E-NE-05: clicking Save clears the dirty indicator', async () => {
        await h.saveNote()
        await browser.waitUntil(
            async () => !(await h.isDirtyIndicatorVisible()),
            { timeout: h.UI_TIMEOUT_MS, timeoutMsg: 'Dirty indicator did not clear after save' },
        )
        const dirty = await h.isDirtyIndicatorVisible()
        expect(dirty).toBe(false)
    })

    // ── Labels ───────────────────────────────────────────────────────────────

    /**
     * TC-E2E-NE-08 — Add label via metadata panel [S-UX-NE1]
     */
    it('TC-E2E-NE-08: adding a label via the metadata panel shows it in the label list', async () => {
        await h.openNote('test-note')
        await h.addLabel('new-label')

        const labels = await h.visibleLabels()
        expect(labels).toContain('new-label')
    })

    /**
     * TC-E2E-NE-09 — Remove label via metadata panel [S-UX-NE1]
     */
    it('TC-E2E-NE-09: removing a label via the metadata panel updates the label list', async () => {
        // Ensure label exists.
        const labelsBefore = await h.visibleLabels()
        if (!labelsBefore.includes('new-label')) {
            await h.addLabel('new-label')
        }

        await h.removeLabel('new-label')

        const labelsAfter = await h.visibleLabels()
        expect(labelsAfter).not.toContain('new-label')
    })

    /**
     * TC-E2E-NE-10 — Content command `/:labels` sets labels [S-UX-NE2]
     */
    it('TC-E2E-NE-10: /:labels command adds labels to the note', async () => {
        await h.openNote('test-note')
        await h.typeInEditor('\n/:labels rust learning;')
        await h.saveNote()

        await browser.waitUntil(
            async () => (await h.visibleLabels()).includes('rust'),
            { timeout: h.UI_TIMEOUT_MS, timeoutMsg: 'Labels from /:labels command not visible after save' },
        )
        const labels = await h.visibleLabels()
        expect(labels).toContain('rust')
        expect(labels).toContain('learning')
    })

    /**
     * TC-E2E-NE-11 — Delete note removes it from list [S-UX-NE3]
     */
    it('TC-E2E-NE-11: deleting a note removes it from the note list', async () => {
        await h.clickBack()
        await h.assertScreen('note_list')
        await h.createNote('disposable-note')
        await h.clickBack()
        await h.assertScreen('note_list')
        await h.openNote('disposable-note')

        await h.deleteNote()

        await h.assertScreen('note_list')
        const titles = await h.visibleNoteTitles()
        expect(titles).not.toContain('disposable-note')
    })

    // ── Draft and Publish ────────────────────────────────────────────────────

    /**
     * TC-E2E-NE-12 — New note created as draft [S-UX-NE1]
     */
    it('TC-E2E-NE-12: new note is created as a draft', async () => {
        await h.createNote('draft-note')

        const draftIndicator = await $('[data-testid="draft-indicator"]')
        await expect(draftIndicator).toBeDisplayed()
    })

    /**
     * TC-E2E-NE-13 — Publish clears draft indicator [S-UX-NE1]
     */
    it('TC-E2E-NE-13: publishing a note clears the draft indicator', async () => {
        await h.saveNote()
        // Re-open to ensure we have the latest state post-save.
        await h.clickBack()
        await h.assertScreen('note_list')
        await h.openNote('draft-note')

        await h.publishNote()

        const draftIndicator = await $('[data-testid="draft-indicator"]')
        await expect(draftIndicator).not.toBeDisplayed()
    })
}
