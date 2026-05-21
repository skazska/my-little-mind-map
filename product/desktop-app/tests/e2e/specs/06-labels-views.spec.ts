/**
 * TC-E2E-LV — Labels and Views tests
 *
 * Covers: TC-E2E-LV-01..03
 * Spec refs: [S-UX-OV1], [S-DM-L2]
 */

import {
    addLabel,
    assertScreen,
    clickBack,
    clickOverviewTab,
    createNote,
    createSpace,
    navigateIntoSpace,
    saveNote,
    useDefaultFolder,
    UI_TIMEOUT_MS,
} from '../helpers/app.js'

describe('Labels and Views', () => {
    before(async () => {
        await useDefaultFolder()
        await assertScreen('overview')

        // Set up two spaces with notes that share a label
        await clickOverviewTab('spaces')

        await createSpace('lv-space1')
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'lv-space1') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS },
        )

        // Create note in space1 with "rust" label
        await navigateIntoSpace('lv-space1')
        await assertScreen('note_list')
        await createNote('note-in-space1')
        await addLabel('rust')
        await saveNote()
        await clickBack()
        await assertScreen('note_list')
        await clickBack()
        await assertScreen('overview')

        await createSpace('lv-space2')
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'lv-space2') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS },
        )

        // Create note in space2 with "rust" label
        await navigateIntoSpace('lv-space2')
        await assertScreen('note_list')
        await createNote('note-in-space2')
        await addLabel('rust')
        await saveNote()
        await clickBack()
        await assertScreen('note_list')
        await clickBack()
        await assertScreen('overview')
    })

    /**
     * TC-E2E-LV-01 — Labels tab shows all labels in use [S-UX-OV1]
     */
    it('TC-E2E-LV-01: Labels tab lists all labels present in the data folder', async () => {
        await clickOverviewTab('labels')

        const labelItems = await $$('[data-testid="label-list-item"]')
        const names = await Promise.all(labelItems.map((el) => el.getAttribute('data-label')))

        expect(names).toContain('rust')
    })

    /**
     * TC-E2E-LV-02 — Clicking a label filters notes across spaces [S-DM-L2]
     */
    it('TC-E2E-LV-02: clicking a label in Labels tab filters notes from all spaces', async () => {
        const rustLabel = await $('[data-testid="label-list-item"][data-label="rust"]')
        await rustLabel.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await rustLabel.click()

        // The view should show notes from both spaces tagged with "rust"
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="note-list-item"]')
                const titles = await Promise.all(items.map((i) => i.getAttribute('data-title')))
                return titles.includes('note-in-space1') && titles.includes('note-in-space2')
            },
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'Cross-space label filter did not show both notes' },
        )
    })

    /**
     * TC-E2E-LV-03 — Views tab shows saved views [S-UX-OV1]
     *
     * A "view" is a saved label-set filter. This test validates the tab and
     * list render correctly when views exist. The views list may be empty if
     * none have been saved in this session.
     */
    it('TC-E2E-LV-03: Views tab is accessible and renders the views list', async () => {
        // Navigate back to overview first if needed
        const screen = await $('[data-screen]')
        const screenId = await screen.getAttribute('data-screen')
        if (screenId !== 'overview') {
            const backBtn = await $('[data-testid="back-btn"]')
            if (await backBtn.isDisplayed()) await backBtn.click()
        }

        await clickOverviewTab('views')

        const viewsList = await $('[data-testid="views-list"]')
        await expect(viewsList).toBeDisplayed()
    })
})
