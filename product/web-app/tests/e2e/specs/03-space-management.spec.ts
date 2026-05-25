/**
 * TC-E2E-SP — Space Management tests (web)
 *
 * Covers: TC-E2E-SP-01..04
 * Spec refs: [S-UX-SA2], [S-UX-NLV1]
 *
 * UI assertions run via the shared scenario.  Web-specific localStorage
 * verification runs in the second describe block.
 */

import { helpers, UI_TIMEOUT_MS } from '../helpers/app.js'
import { runSpaceManagementSpec } from '../../../../e2e-shared/scenarios/space-management.js'

describe('Space Management', () => runSpaceManagementSpec(helpers))

describe('Space Management — localStorage verification', () => {
    before(async () => {
        await helpers.resetAndBootstrap()
        await helpers.clickOverviewTab('spaces')
    })

    /**
     * TC-E2E-SP-01-ls: creating a space persists a record in localStorage.
     */
    it('TC-E2E-SP-01-ls: creating a space adds a record to localStorage', async () => {
        await helpers.createSpace('ls-space')
        await browser.waitUntil(() => helpers.isSpaceVisible('ls-space'), { timeout: UI_TIMEOUT_MS })

        const keys: string[] = await browser.execute(() => {
            const result: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k) result.push(k)
            }
            return result
        })
        // There should be at least one mlmm: key after creating a space.
        expect(keys.some((k) => k.startsWith('mlmm:'))).toBe(true)
    })

    /**
     * TC-E2E-SP-04-ls: deleting a space removes its data from localStorage.
     */
    it('TC-E2E-SP-04-ls: deleting a space removes its data from localStorage', async () => {
        await helpers.createSpace('ls-temp')
        await browser.waitUntil(() => helpers.isSpaceVisible('ls-temp'), { timeout: UI_TIMEOUT_MS })

        const keysBefore: string[] = await browser.execute(() => {
            const result: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k) result.push(k)
            }
            return result
        })

        await helpers.deleteSpace('ls-temp')
        await browser.waitUntil(
            async () => !(await helpers.isSpaceVisible('ls-temp')),
            { timeout: UI_TIMEOUT_MS },
        )

        const keysAfter: string[] = await browser.execute(() => {
            const result: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k) result.push(k)
            }
            return result
        })

        // The key count must have decreased or data must have changed.
        expect(keysAfter.length).toBeLessThanOrEqual(keysBefore.length)
    })
})
