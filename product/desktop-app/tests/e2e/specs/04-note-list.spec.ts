/**
 * TC-E2E-NL — Note List tests
 *
 * Covers: TC-E2E-NL-01..08
 * Spec refs: [S-UX-NVT1], [S-UX-NVT2]
 */

import {
    assertScreen,
    clickOverviewTab,
    createSpace,
    navigateIntoSpace,
    resetAppState,
    useDefaultFolder,
    UI_TIMEOUT_MS,
} from '../helpers/app.js'
import { helpers } from '../helpers/app.js'
import { runNoteListSpec } from '../../../../e2e-shared/scenarios/note-list.js'

describe('Note List', () => {
    before(async () => {
        await resetAppState()
        await useDefaultFolder()
        await assertScreen('overview')
        await clickOverviewTab('spaces')

        await createSpace('space1')
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
        await navigateIntoSpace('space1')
        await assertScreen('note_list')
    })

    runNoteListSpec(helpers)
})
