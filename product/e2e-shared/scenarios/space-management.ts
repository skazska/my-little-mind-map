/**
 * Shared E2E scenario: Space Management
 *
 * Covers: TC-E2E-SP-01..04 (UI assertions only; platform-specific storage
 * checks — disk layout on desktop, localStorage on web — belong in the
 * platform wrapper describe block alongside the shared call).
 *
 * Spec refs: [S-UX-SA2], [S-UX-NLV1]
 *
 * Call inside a `describe('Space Management', ...)` block:
 *   describe('Space Management', () => runSpaceManagementSpec(h))
 */

import type { E2eHelpers } from '../helpers.js'

export function runSpaceManagementSpec(h: E2eHelpers): void {
    before(async () => {
        await h.resetAndBootstrap()
        await h.clickOverviewTab('spaces')
    })

    /**
     * TC-E2E-SP-01 — Create space with name only [S-UX-SA2]
     */
    it('TC-E2E-SP-01: creating a space adds it to the list', async () => {
        await h.createSpace('my-space')

        await browser.waitUntil(() => h.isSpaceVisible('my-space'), {
            timeout: h.UI_TIMEOUT_MS,
            timeoutMsg: '"my-space" not visible in spaces list',
        })
    })

    /**
     * TC-E2E-SP-02 — Create space with name and description
     */
    it('TC-E2E-SP-02: creating a space with description shows description in list', async () => {
        await h.createSpace('work', 'Work notes')

        await browser.waitUntil(() => h.isSpaceVisible('work'), {
            timeout: h.UI_TIMEOUT_MS,
            timeoutMsg: '"work" not visible in spaces list',
        })

        const item = await $('[data-testid="space-item"][data-name="work"]')
        const text = await item.getText()
        expect(text).toContain('Work notes')
    })

    /**
     * TC-E2E-SP-03 — Navigate into a space opens note list [S-UX-NLV1]
     */
    it('TC-E2E-SP-03: clicking a space opens the note list screen', async () => {
        await h.navigateIntoSpace('my-space')
        await h.assertScreen('note_list')
    })

    /**
     * TC-E2E-SP-04 — Delete space removes it from list
     */
    it('TC-E2E-SP-04: deleting a space removes it from the list', async () => {
        // Navigate back to overview if we ended up in note_list.
        const backBtn = await $('[data-testid="back-btn"]')
        const backVisible = await backBtn.isDisplayed().catch(() => false)
        if (backVisible) {
            await h.clickBack()
            await h.assertScreen('overview')
        }
        await h.clickOverviewTab('spaces')

        await h.createSpace('temp-space')
        await browser.waitUntil(() => h.isSpaceVisible('temp-space'), {
            timeout: h.UI_TIMEOUT_MS,
        })

        await h.deleteSpace('temp-space')

        await browser.waitUntil(async () => !(await h.isSpaceVisible('temp-space')), {
            timeout: h.UI_TIMEOUT_MS,
            timeoutMsg: '"temp-space" still visible after delete',
        })
    })
}
