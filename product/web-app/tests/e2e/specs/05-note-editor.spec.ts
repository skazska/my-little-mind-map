/**
 * TC-E2E-NE — Note Editor tests (web)
 *
 * Covers: TC-E2E-NE-01..14
 * Spec refs: [S-UX-NLV5], [S-UX-NE1], [S-UX-NE2], [S-UX-NE3], [S-UX-NE4], [S-UX-NE6]
 *
 * TC-E2E-NE-01, 03–05, 08–13 run via the shared scenario.
 * TC-E2E-NE-02, 06, 14 are web-specific and live in the second describe block.
 * TC-E2E-NE-07 (content preservation) is implicitly covered by TC-E2E-NE-06-web
 * (autosave round-trip via localStorage).
 */

import { helpers, AUTOSAVE_DEBOUNCE_S, UI_TIMEOUT_MS } from '../helpers/app.js'
import { runNoteEditorSpec } from '../../../../e2e-shared/scenarios/note-editor.js'

describe('Note Editor', () => {
    before(async () => {
        await helpers.resetAndBootstrap()
        await helpers.clickOverviewTab('spaces')

        await helpers.createSpace('editor-space')
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'editor-space') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS },
        )
        await helpers.navigateIntoSpace('editor-space')
        await helpers.assertScreen('note_list')

        await helpers.createNote('test-note')
        await helpers.clickBack()
        await helpers.assertScreen('note_list')
    })

    runNoteEditorSpec(helpers)
})

describe('Note Editor — web-specific', () => {
    before(async () => {
        await helpers.resetAndBootstrap()
        await helpers.clickOverviewTab('spaces')

        await helpers.createSpace('ws-editor-space')
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'ws-editor-space') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS },
        )
        await helpers.navigateIntoSpace('ws-editor-space')
        await helpers.assertScreen('note_list')

        await helpers.createNote('ws-test-note')
        await helpers.clickBack()
        await helpers.assertScreen('note_list')
    })

    /**
     * TC-E2E-NE-02-web — Metadata panel shows title and labels.
     *
     * On the web ViewModel, UUID and ISO dates are not yet surfaced in the UI,
     * so only title and label input are asserted.
     */
    it('TC-E2E-NE-02-web: metadata panel displays title and label input', async () => {
        await helpers.openNote('ws-test-note')
        await helpers.assertScreen('note_editor')

        const titleEl = await $('[data-testid="metadata-title"]')
        await expect(titleEl).toBeDisplayed()

        const labelInput = await $('[data-testid="metadata-label-input"]')
        await expect(labelInput).toBeDisplayed()
    })

    /**
     * TC-E2E-NE-06-web — Autosave fires after the debounce period (localStorage).
     *
     * We verify the note content is persisted to localStorage (not disk) after
     * the shorter web debounce period of 1.5 s.
     */
    it('TC-E2E-NE-06-web: autosave persists content to localStorage after debounce', async () => {
        await helpers.openNote('ws-test-note')
        const autosaveMarker = `autosave-web-${Date.now()}`
        await helpers.typeInEditor(autosaveMarker)

        // Wait for debounce + margin.
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 2) * 1_000)

        const found: boolean = await browser.execute((marker: string) => {
            for (let i = 0; i < localStorage.length; i++) {
                const val = localStorage.getItem(localStorage.key(i) ?? '')
                if (val && val.includes(marker)) return true
            }
            return false
        }, autosaveMarker)

        expect(found).toBe(true)
    })

    /**
     * TC-E2E-NE-14-web — Publish shows a confirmation dialog before formatting.
     */
    it('TC-E2E-NE-14-web: Publish action shows a confirmation dialog', async () => {
        await helpers.clickBack()
        await helpers.assertScreen('note_list')
        await helpers.createNote('ws-confirm-publish')

        const publishBtn = await $('[data-testid="publish-note-btn"]')
        await publishBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await publishBtn.click()

        const dialog = await $('[data-testid="publish-confirm-dialog"]')
        await expect(dialog).toBeDisplayed()

        // Dismiss without publishing.
        const cancelBtn = await $('[data-testid="publish-confirm-cancel"]')
        await cancelBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await cancelBtn.click()

        // Dialog should be gone; we're still in the editor.
        await expect(dialog).not.toBeDisplayed()
        await helpers.assertScreen('note_editor')
    })
})
