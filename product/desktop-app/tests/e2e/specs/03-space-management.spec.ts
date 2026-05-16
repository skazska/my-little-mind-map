/**
 * TC-E2E-SP — Space Management tests
 *
 * Covers: TC-E2E-SP-01..04
 * Spec refs: [S-UX-SA2], [S-UX-NLV1]
 */

import {
    assertScreen,
    clickOverviewTab,
    createSpace,
    deleteSpace,
    isSpaceVisible,
    navigateIntoSpace,
    useDefaultFolder,
    UI_TIMEOUT_MS,
} from '../helpers/app.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

let dataDir: string

describe('Space Management', () => {
    before(async () => {
        await useDefaultFolder()
        await assertScreen('overview')
        const statusPath = await $('[data-testid="status-bar-path"]')
        await statusPath.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        dataDir = (await statusPath.getText()).trim()
        await clickOverviewTab('spaces')
    })

    /**
     * TC-E2E-SP-01 — Create space with name only
     */
    it('TC-E2E-SP-01: creating a space adds it to the list and creates a directory', async () => {
        await createSpace('my-space')

        await browser.waitUntil(() => isSpaceVisible('my-space'), {
            timeout: UI_TIMEOUT_MS,
            timeoutMsg: '"my-space" not visible in spaces list',
        })

        // Directory should exist on disk
        const spaceDir = path.join(dataDir, 'spaces', 'my-space')
        expect(fs.existsSync(spaceDir)).toBe(true)
    })

    /**
     * TC-E2E-SP-02 — Create space with name and description
     */
    it('TC-E2E-SP-02: creating a space with description shows description in list', async () => {
        await createSpace('work', 'Work notes')

        await browser.waitUntil(() => isSpaceVisible('work'), {
            timeout: UI_TIMEOUT_MS,
            timeoutMsg: '"work" not visible in spaces list',
        })

        // Description should be visible somewhere in the space list item
        const item = await $('[data-testid="space-item"][data-name="work"]')
        const text = await item.getText()
        expect(text).toContain('Work notes')
    })

    /**
     * TC-E2E-SP-03 — Navigate into a space opens note list [S-UX-NLV1]
     */
    it('TC-E2E-SP-03: clicking a space opens the note list screen', async () => {
        await navigateIntoSpace('my-space')
        await assertScreen('note_list')
    })

    /**
     * TC-E2E-SP-04 — Delete space removes it from list and from disk
     */
    it('TC-E2E-SP-04: deleting a space removes it from the list and disk', async () => {
        // Ensure we're back at overview first
        const backBtn = await $('[data-testid="back-btn"]')
        if (await backBtn.isDisplayed()) {
            await backBtn.click()
            await assertScreen('overview')
        }
        await clickOverviewTab('spaces')

        // Create a temporary space to delete
        await createSpace('temp-space')
        await browser.waitUntil(() => isSpaceVisible('temp-space'), {
            timeout: UI_TIMEOUT_MS,
        })

        const spaceDir = path.join(dataDir, 'spaces', 'temp-space')

        await deleteSpace('temp-space')

        await browser.waitUntil(async () => !(await isSpaceVisible('temp-space')), {
            timeout: UI_TIMEOUT_MS,
            timeoutMsg: '"temp-space" still visible after delete',
        })

        expect(fs.existsSync(spaceDir)).toBe(false)
    })
})
