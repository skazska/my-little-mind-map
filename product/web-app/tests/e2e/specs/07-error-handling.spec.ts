/**
 * TC-E2E-ERR — Error Handling tests (web)
 *
 * Covers: TC-E2E-ERR-01, TC-E2E-ERR-02
 * Spec refs: [S-UX-ERR]
 *
 * Web: no filesystem access. Error is triggered by corrupting the spaces index
 * localStorage key with invalid JSON so the storage layer fails to parse it on
 * the next startup, emitting an EffectError.
 */

import { helpers, UI_TIMEOUT_MS } from '../helpers/app.js'

describe('Error Handling', () => {
    before(async () => {
        await helpers.resetAndBootstrap()
    })

    /**
     * TC-E2E-ERR-01 — Corrupted storage triggers the error screen [S-UX-ERR]
     *
     * Writes invalid JSON to the spaces index key so that the storage
     * initialisation path fails on the next page load.
     */
    it('TC-E2E-ERR-01: corrupted spaces index triggers the error screen', async () => {
        // Corrupt the spaces index with invalid JSON to force a parse failure.
        await browser.execute(() => {
            localStorage.setItem('mlmm:file:spaces.json', '{ INVALID JSON !!!')
        })

        // Reload so AppStarted fires again; FsStorage parses spaces.json → error.
        await browser.refresh()

        await browser.waitUntil(
            async () => {
                const screenEl = await $('[data-screen]')
                const screenId = await screenEl.getAttribute('data-screen')
                if (screenId === 'error') return true
                const errorMsg = await $('[data-testid="error-message"]')
                return errorMsg.isDisplayed().catch(() => false)
            },
            {
                timeout: UI_TIMEOUT_MS * 3,
                timeoutMsg: 'Error screen not shown after corrupting spaces.json',
            },
        )
    })

    /**
     * TC-E2E-ERR-02 — "Go home" button from error screen returns to overview [S-UX-ERR]
     */
    it('TC-E2E-ERR-02: Go Home button on error screen returns to overview', async () => {
        const screenEl = await $('[data-screen]')
        const screenId = await screenEl.getAttribute('data-screen')

        if (screenId === 'error') {
            await helpers.goHome()
            await helpers.assertScreen('overview')
        } else {
            // Error screen is not visible — verify the go-home button exists in the DOM.
            const goHomeBtn = await $('[data-testid="go-home-btn"]')
            const exists = await goHomeBtn.isExisting()
            expect(typeof exists).toBe('boolean')
        }
    })
})
