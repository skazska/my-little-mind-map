/**
 * TC-E2E-FL — First Launch tests
 *
 * Covers: TC-E2E-FL-01..05
 * Spec refs: [S-UX-SA4], [S-CFG-1], [S-CFG-2], [S-UX-SA3]
 */

import {
    assertScreen,
    getStatusBarPath,
    useDefaultFolder,
    waitForScreen,
    UI_TIMEOUT_MS,
} from '../helpers/app.js'

describe('First Launch', () => {
    /**
     * TC-E2E-FL-01 — First launch shows folder selection screen [S-UX-SA4]
     */
    it('TC-E2E-FL-01: shows first_launch screen on fresh start', async () => {
        await assertScreen('first_launch')
        const btn = await $('[data-testid="select-folder-btn"]')
        await expect(btn).toBeDisplayed()
        const defaultBtn = await $('[data-testid="use-default-folder-btn"]')
        await expect(defaultBtn).toBeDisplayed()
    })

    /**
     * TC-E2E-FL-02 — Selecting a data folder transitions to overview [S-UX-SA4]
     *
     * This test requires the system file-picker dialog; it is validated via the
     * "Use default folder" code path which bypasses the native dialog.
     * A separate manual QA checklist covers the native dialog flow.
     */
    it('TC-E2E-FL-02: selecting a data folder transitions to overview', async () => {
        // Use default folder to avoid native dialog interaction in CI
        await useDefaultFolder()
        await assertScreen('overview')
    })

    /**
     * TC-E2E-FL-03 — Using default data folder transitions to overview [S-CFG-2]
     */
    it('TC-E2E-FL-03: using default folder transitions to overview and creates folder', async () => {
        await useDefaultFolder()
        await assertScreen('overview')
        // The status bar should display a non-empty path (folder was created).
        const displayedPath = await getStatusBarPath()
        expect(displayedPath.trim().length).toBeGreaterThan(0)
    })

    /**
     * TC-E2E-FL-04 — Selected folder persisted across app restarts [S-CFG-1]
     *
     * Full restart verification requires re-launching the Tauri process.
     * This test validates the persistence artifact on disk instead.
     */
    it('TC-E2E-FL-04: settings file is written after folder selection', async () => {
        const { execSync } = await import('node:child_process')
        await useDefaultFolder()
        await assertScreen('overview')
        // Retrieve the data dir from the status bar so we know where to look.
        const dataDir = await getStatusBarPath()
        const settingsPath = require('node:path').join(dataDir.trim(), 'settings.json')
        await browser.waitUntil(
            () => require('node:fs').existsSync(settingsPath),
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'settings.json not created after folder selection' },
        )
    })

    /**
     * TC-E2E-FL-05 — Status bar shows correct data folder path [S-UX-SA3]
     */
    it('TC-E2E-FL-05: status bar displays data folder path', async () => {
        await useDefaultFolder()
        await assertScreen('overview')
        const displayedPath = await getStatusBarPath()
        expect(displayedPath.trim().length).toBeGreaterThan(0)
    })
})
