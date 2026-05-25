/**
 * Shared E2E scenario: Overview screen
 *
 * Covers: TC-E2E-OV-01..03
 * Spec refs: [S-UX-MF1], [S-UX-ST1], [S-UX-ST3]
 *
 * Call inside a `describe('Overview', ...)` block:
 *   describe('Overview', () => runOverviewSpec(h))
 */

import type { E2eHelpers } from '../helpers.js'

export function runOverviewSpec(h: E2eHelpers): void {
    before(async () => {
        await h.resetAndBootstrap()
        await h.assertScreen('overview')
    })

    /**
     * TC-E2E-OV-01 — Overview shows navigation options for Spaces, Labels, Notes views, Recent, and Search [S-UX-MF1]
     */
    it('TC-E2E-OV-01: shows Spaces, Labels, Notes views, Recent activity, and Search navigation options', async () => {
        for (const tab of ['spaces', 'labels', 'views', 'recent', 'search'] as const) {
            const el = await $(`[data-testid="tab-${tab}"]`)
            await expect(el).toBeDisplayed()
        }
    })

    /**
     * TC-E2E-OV-02 — Spaces tab is active by default [S-UX-MF1] [S-UX-ST1]
     */
    it('TC-E2E-OV-02: Spaces tab is selected by default', async () => {
        const tab = await $('[data-testid="tab-spaces"]')
        const isSelected = await tab.getAttribute('aria-selected')
        expect(isSelected).toBe('true')
        await h.waitForSpacesList()
    })

    /**
     * TC-E2E-OV-03 — Create space action is visible [S-UX-ST3]
     */
    it('TC-E2E-OV-03: Create space button is visible in Spaces tab', async () => {
        await h.clickOverviewTab('spaces')
        const createBtn = await $('[data-testid="create-space-btn"]')
        await expect(createBtn).toBeDisplayed()
    })
}
