/**
 * TC-E2E-SP — Space Management tests
 *
 * Covers: TC-E2E-SP-01..04
 * Spec refs: [S-UX-SA2], [S-UX-NVT1]
 *
 * UI assertions run via the shared scenario. Desktop-specific disk-layout
 * verification runs in the additional describe block below.
 */

import {
    assertScreen,
    clickOverviewTab,
    createSpace,
    isSpaceVisible,
    resetAppState,
    useDefaultFolder,
    UI_TIMEOUT_MS,
} from '../helpers/app.js'
import { helpers } from '../helpers/app.js'
import { runSpaceManagementSpec } from '../../../../e2e-shared/scenarios/space-management.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

let dataDir: string

describe('Space Management', () => runSpaceManagementSpec(helpers))

describe('Space Management — disk layout', () => {
    before(async () => {
        await resetAppState()
        await useDefaultFolder()
        await assertScreen('overview')
        const statusPath = await $('[data-testid="status-bar-path"]')
        await statusPath.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        dataDir = (await statusPath.getText()).trim()
        await clickOverviewTab('spaces')
    })

    it('TC-E2E-SP-01-disk: creating a space creates a directory on disk', async () => {
        await createSpace('disk-space')
        await browser.waitUntil(() => isSpaceVisible('disk-space'), { timeout: UI_TIMEOUT_MS })
        const spaceDir = path.join(dataDir, 'spaces', 'disk-space')
        expect(fs.existsSync(spaceDir)).toBe(true)
    })

    it('TC-E2E-SP-04-disk: deleting a space removes its directory from disk', async () => {
        await createSpace('disk-temp')
        await browser.waitUntil(() => isSpaceVisible('disk-temp'), { timeout: UI_TIMEOUT_MS })
        const spaceDir = path.join(dataDir, 'spaces', 'disk-temp')

        const deleteBtn = await $(
            '[data-testid="space-item"][data-name="disk-temp"] [data-testid="delete-space-btn"]',
        )
        await deleteBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await browser.execute((el) => (el as HTMLElement).click(), deleteBtn)

        await browser.waitUntil(async () => !(await isSpaceVisible('disk-temp')), { timeout: UI_TIMEOUT_MS })
        expect(fs.existsSync(spaceDir)).toBe(false)
    })
})
