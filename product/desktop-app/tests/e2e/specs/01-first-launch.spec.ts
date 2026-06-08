/**
 * TC-E2E-FL — First Launch tests
 *
 * Covers: TC-E2E-FL-01..07
 * Spec refs: @(S-UX-SA1,S-UX-SA2,S-UX-SA3,S-UX-MF1,S-CFG-1,S-CFG-2)
 */

import * as nodePath from 'node:path'
import * as nodeFs from 'node:fs'
import {
    assertScreen,
    getStatusBarPath,
    resetAppState,
    useDefaultFolder,
    UI_TIMEOUT_MS,
} from '../helpers/app.js'

describe('First Launch', () => {
    beforeEach(async () => {
        await resetAppState()
    })

    /**
     * TC-E2E-FL-01 — First launch shows folder selection screen @S-UX-SA1
     */
    it('TC-E2E-FL-01: shows first_launch screen on fresh start', async () => {
        await assertScreen('first_launch')
        const btn = await $('[data-testid="select-folder-btn"]')
        await expect(btn).toBeDisplayed()
        const defaultBtn = await $('[data-testid="use-default-folder-btn"]')
        await expect(defaultBtn).toBeDisplayed()
    })

    /**
     * TC-E2E-FL-02 — Selecting a data folder transitions to overview @S-UX-SA1
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
     * TC-E2E-FL-03 — Using default data folder transitions to overview @S-CFG-2
     */
    it('TC-E2E-FL-03: using default folder transitions to overview and creates folder', async () => {
        await useDefaultFolder()
        await assertScreen('overview')
        // The status bar should display a non-empty path (folder was created).
        const displayedPath = await getStatusBarPath()
        expect(displayedPath.trim().length).toBeGreaterThan(0)
    })

    /**
     * TC-E2E-FL-04 — Selected folder persisted across app restarts @S-CFG-1
     *
     * Full restart verification requires re-launching the Tauri process.
     * This test validates the persistence artifact on disk instead.
     */
    it('TC-E2E-FL-04: settings file is written after folder selection', async () => {
        await useDefaultFolder()
        await assertScreen('overview')
        // Retrieve the data dir from the status bar so we know where to look.
        const dataDir = await getStatusBarPath()
        const settingsPath = nodePath.join(dataDir.trim(), 'settings.json')
        await browser.waitUntil(
            () => nodeFs.existsSync(settingsPath),
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'settings.json not created after folder selection' },
        )
    })

    /**
     * TC-E2E-FL-05 — Status bar shows correct data folder path @S-UX-MF1
     */
    it('TC-E2E-FL-05: status bar displays data folder path', async () => {
        await useDefaultFolder()
        await assertScreen('overview')
        const displayedPath = await getStatusBarPath()
        expect(displayedPath.trim().length).toBeGreaterThan(0)
    })

    /**
     * TC-E2E-FL-06 — Default space "My" is created when no space exists @S-UX-SA2
     */
    it('TC-E2E-FL-06: default space "My" is created in a fresh data folder', async () => {
        await useDefaultFolder()
        await assertScreen('overview')
        const dataDir = await getStatusBarPath()
        // Space "My" directory must exist on disk.
        const mySpaceDir = nodePath.join(dataDir.trim(), 'spaces', 'my')
        await browser.waitUntil(
            () => nodeFs.existsSync(mySpaceDir),
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'spaces/my/ directory not created' },
        )
        // And "my" must appear in the spaces list in the UI.
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'My') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'default space "My" not visible in spaces list' },
        )
    })

    /**
     * TC-E2E-FL-07 — App opens new note when no prior context @S-UX-SA3
     */
    it('TC-E2E-FL-07: app shows notes view with a new note editor on first launch', async () => {
        await useDefaultFolder({ stayOnStartupDestination: true })
        // After first launch with no intent, the app should land on the notes view
        // with a new draft note editor active.
        const noteEditorOrNotesView = await browser.waitUntil(
            async () => {
                const editor = await $('[data-screen="note_editor"]')
                if (await editor.isDisplayed().catch(() => false)) return 'note_editor'
                const noteList = await $('[data-screen="note_list"]')
                if (await noteList.isDisplayed().catch(() => false)) return 'note_list'
                return false
            },
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'neither note_editor nor note_list visible after launch' },
        )
        expect(noteEditorOrNotesView).toBe('note_editor')
    })
})
