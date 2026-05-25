/**
 * Shared E2E scenario: Labels and Views
 *
 * Covers: TC-E2E-LV-01..03
 * Spec refs: [S-UX-OV1], [S-DM-L2]
 *
 * Call inside a `describe('Labels and Views', ...)` block.
 * The wrapper `before()` must set up two spaces each with a note labelled
 * 'rust' so the labels cross-space filter can be asserted.
 *
 *   describe('Labels and Views', () => runLabelsViewsSpec(h))
 */

import type { E2eHelpers } from '../helpers.js'

export function runLabelsViewsSpec(h: E2eHelpers): void {
    /**
     * TC-E2E-LV-01 — Labels tab shows all labels in use [S-UX-OV1]
     */
    it('TC-E2E-LV-01: Labels tab lists all labels present in the data folder', async () => {
        await h.clickOverviewTab('labels')

        const labelItems = await $$('[data-testid="label-list-item"]')
        const names = await labelItems.map((el) => el.getAttribute('data-label'))

        expect(names).toContain('rust')
    })

    /**
     * TC-E2E-LV-02 — Clicking a label filters notes across spaces [S-DM-L2]
     */
    it('TC-E2E-LV-02: clicking a label in Labels tab filters notes from all spaces', async () => {
        await h.clickLabelItem('rust')

        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="note-list-item"]')
                const titles = await items.map((i) => i.getAttribute('data-title'))
                return titles.includes('note-in-space1') && titles.includes('note-in-space2')
            },
            { timeout: h.UI_TIMEOUT_MS, timeoutMsg: 'Cross-space label filter did not show both notes' },
        )
    })

    /**
     * TC-E2E-LV-03 — Views tab is accessible and renders the views list [S-UX-OV1]
     */
    it('TC-E2E-LV-03: Views tab is accessible and renders the views list', async () => {
        // Navigate back to overview if we ended up in note_list.
        const screenEl = await $('[data-screen]')
        const screenId = await screenEl.getAttribute('data-screen')
        if (screenId !== 'overview') {
            const backBtn = await $('[data-testid="back-btn"]')
            if (await backBtn.isDisplayed()) {
                await backBtn.click()
            }
        }

        await h.clickOverviewTab('views')

        const viewsList = await $('[data-testid="views-list"]')
        await expect(viewsList).toBeDisplayed()
    })
}
