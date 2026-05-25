/**
 * TC-E2E-LV — Labels and Views tests (web)
 *
 * Covers: TC-E2E-LV-01..03
 * Spec refs: [S-UX-OV3], [S-UX-LV1], [S-UX-LV2]
 */

import { helpers, UI_TIMEOUT_MS } from '../helpers/app.js'
import { runLabelsViewsSpec } from '../../../../e2e-shared/scenarios/labels-views.js'

describe('Labels and Views', () => {
    before(async () => {
        await helpers.resetAndBootstrap()
        await helpers.clickOverviewTab('spaces')

        // Create two spaces, each with a 'rust'-labelled note.
        for (const spaceName of ['lv-space-a', 'lv-space-b']) {
            await helpers.createSpace(spaceName)
            await browser.waitUntil(
                async () => {
                    const items = await $$('[data-testid="space-item"]')
                    for (const item of items) {
                        if ((await item.getAttribute('data-name')) === spaceName) return true
                    }
                    return false
                },
                { timeout: UI_TIMEOUT_MS },
            )
            await helpers.navigateIntoSpace(spaceName)
            await helpers.assertScreen('note_list')

            await helpers.createNote(`${spaceName}-note`)
            await helpers.addLabel('rust')
            await helpers.saveNote()
            await helpers.clickBack()
            await helpers.assertScreen('note_list')
            await helpers.clickBack()
            await helpers.assertScreen('overview')
            await helpers.clickOverviewTab('spaces')
        }
    })

    runLabelsViewsSpec(helpers)
})
