/**
 * TC-E2E-OV — Overview screen tests
 *
 * Covers: TC-E2E-OV-01..03
 * Spec refs: [S-UX-OV1], [S-UX-SA2]
 */

import {
    assertScreen,
    clickOverviewTab,
    useDefaultFolder,
    waitForSpacesList,
} from '../helpers/app.js'

describe('Overview', () => {
    before(async () => {
        await useDefaultFolder()
        await assertScreen('overview')
    })

    /**
     * TC-E2E-OV-01 — Overview shows 5 tabs [S-UX-OV1]
     */
    it('TC-E2E-OV-01: shows Spaces, Labels, Views, Recent, and Search tabs', async () => {
        for (const tab of ['spaces', 'labels', 'views', 'recent', 'search'] as const) {
            const el = await $(`[data-testid="tab-${tab}"]`)
            await expect(el).toBeDisplayed()
        }
    })

    /**
     * TC-E2E-OV-02 — Spaces tab is active by default [S-UX-OV1]
     */
    it('TC-E2E-OV-02: Spaces tab is selected by default', async () => {
        const tab = await $('[data-testid="tab-spaces"]')
        const isSelected = await tab.getAttribute('aria-selected')
        expect(isSelected).toBe('true')
        await waitForSpacesList()
    })

    /**
     * TC-E2E-OV-03 — Create space action is visible [S-UX-SA2]
     */
    it('TC-E2E-OV-03: Create space button is visible in Spaces tab', async () => {
        await clickOverviewTab('spaces')
        const createBtn = await $('[data-testid="create-space-submit"], [data-testid="create-space-btn"]')
        await expect(createBtn).toBeDisplayed()
    })
})
