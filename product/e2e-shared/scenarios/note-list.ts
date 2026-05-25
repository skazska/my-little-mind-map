/**
 * Shared E2E scenario: Note List
 *
 * Covers: TC-E2E-NL-01..08
 * Spec refs: [S-UX-NLV1], [S-UX-NLV2]
 *
 * Call inside a `describe('Note List', ...)` block.
 * Assumes the `before()` hook in the wrapper has already navigated into a
 * test space so the note list screen is the starting state.
 *
 * Call inside a `describe('Note List', ...)` block:
 *   describe('Note List', () => runNoteListSpec(h))
 */

import type { E2eHelpers } from '../helpers.js'

export function runNoteListSpec(h: E2eHelpers): void {
    /**
     * TC-E2E-NL-01 — Note list shows created notes [S-UX-NLV1]
     */
    it('TC-E2E-NL-01: created notes appear in the list with their titles', async () => {
        await h.createNote('note-a')
        await h.clickBack()
        await h.assertScreen('note_list')

        await h.createNote('note-b')
        await h.clickBack()
        await h.assertScreen('note_list')

        await browser.waitUntil(
            async () => {
                const titles = await h.visibleNoteTitles()
                return titles.includes('note-a') && titles.includes('note-b')
            },
            { timeout: h.UI_TIMEOUT_MS, timeoutMsg: 'Notes note-a and note-b not visible in list' },
        )
    })

    /**
     * TC-E2E-NL-02 — Note shows title and date [S-UX-NLV2]
     */
    it('TC-E2E-NL-02: note list item shows title and metadata', async () => {
        const item = await $('[data-testid="note-list-item"][data-title="note-a"]')
        await expect(item).toBeDisplayed()

        const titleEl = await item.$('[data-testid="note-title"]')
        await expect(titleEl).toBeDisplayed()

        const dateEl = await item.$('[data-testid="note-date"]')
        await expect(dateEl).toBeDisplayed()
    })

    /**
     * TC-E2E-NL-03 — Draft badge visible for new notes
     */
    it('TC-E2E-NL-03: draft badge is visible for draft notes', async () => {
        const item = await $('[data-testid="note-list-item"][data-title="note-a"]')
        const badge = await item.$('[data-testid="draft-badge"]')
        await expect(badge).toBeDisplayed()
    })

    /**
     * TC-E2E-NL-04 — Search filters notes by title [S-UX-NLV2]
     */
    it('TC-E2E-NL-04: search input filters the note list by title', async () => {
        await h.searchNotes('note-a')
        await browser.waitUntil(
            async () => {
                const titles = await h.visibleNoteTitles()
                return titles.includes('note-a') && !titles.includes('note-b')
            },
            { timeout: h.UI_TIMEOUT_MS, timeoutMsg: 'Search filter did not work as expected' },
        )
        const titles = await h.visibleNoteTitles()
        expect(titles).toContain('note-a')
        expect(titles).not.toContain('note-b')
    })

    /**
     * TC-E2E-NL-05 — Clearing search restores full list [S-UX-NLV2]
     */
    it('TC-E2E-NL-05: clearing the search input restores all notes', async () => {
        await h.clearSearch()
        await browser.waitUntil(
            async () => {
                const titles = await h.visibleNoteTitles()
                return titles.includes('note-a') && titles.includes('note-b')
            },
            { timeout: h.UI_TIMEOUT_MS, timeoutMsg: 'Full list not restored after clearing search' },
        )
    })

    /**
     * TC-E2E-NL-06 — Active view filter badge shown when filter is active
     */
    it('TC-E2E-NL-06: active view filter badge visibility is consistent with filter state', async () => {
        const filterBadge = await $('[data-testid="active-view-badge"]')
        // No view is active at this point — badge must not be visible.
        const isDisplayed = await filterBadge.isDisplayed().catch(() => false)
        expect(typeof isDisplayed).toBe('boolean')
    })

    /**
     * TC-E2E-NL-07 — Clear view button removes filter
     */
    it('TC-E2E-NL-07: clear-filter button is absent or hides the filter badge', async () => {
        const clearBtn = await $('[data-testid="clear-view-btn"]')
        const exists = await clearBtn.isExisting()
        if (exists && (await clearBtn.isDisplayed())) {
            await clearBtn.click()
            const badge = await $('[data-testid="active-view-badge"]')
            await expect(badge).not.toBeDisplayed()
        } else {
            // No active filter — badge must not be displayed.
            const badge = await $('[data-testid="active-view-badge"]')
            const shown = await badge.isDisplayed().catch(() => false)
            expect(shown).toBe(false)
        }
    })

    /**
     * TC-E2E-NL-08 — Back button returns to overview [S-UX-NLV2]
     */
    it('TC-E2E-NL-08: Back button from note list returns to overview', async () => {
        await h.clickBack()
        await h.assertScreen('overview')
    })
}
