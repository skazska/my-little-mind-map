/**
 * TC-E2E-NL — Note List tests (web)
 *
 * Covers: TC-E2E-NL-01..08
 * Spec refs: [S-UX-NVT1], [S-UX-NVT2]
 */

import { helpers, UI_TIMEOUT_MS } from '../helpers/app.js'
import { runNoteListSpec } from '../../../../e2e-shared/scenarios/note-list.js'

describe('Note List', () => {
    before(async () => {
        await helpers.resetAndBootstrap()
        await helpers.clickOverviewTab('spaces')

        await helpers.createSpace('space1')
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'space1') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS },
        )
        await helpers.navigateIntoSpace('space1')
        await helpers.assertScreen('note_list')
    })

    runNoteListSpec(helpers)
})
