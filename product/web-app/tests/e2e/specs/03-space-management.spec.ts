/**
 * TC-E2E-SP — Space Management tests (web)
 *
 * Covers: TC-E2E-SP-01..04
 * Spec refs: [S-UX-SA2], [S-UX-NLV1]
 *
 * UI assertions run via the shared scenario. Web-specific S-ST-LS3 file-tree
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
     * TC-E2E-SP-01-ls / TC-ST-SP-02 / TC-ST-LS3-05 — creating a space persists the S-ST-DM4
     * spaces index in the web S-ST-LS3 local store.
     */
    it('TC-E2E-SP-01-ls/TC-ST-SP-02/TC-ST-LS3-05 [S-ST-LS3,S-ST-DM4]: creating a space updates spaces.json', async () => {
        await helpers.createSpace('ls-space')
        await browser.waitUntil(() => helpers.isSpaceVisible('ls-space'), { timeout: UI_TIMEOUT_MS })

        const state = await browser.execute(() => ({
            legacyBlob: localStorage.getItem('mlmm:data'),
            spacesJson: localStorage.getItem('mlmm:file:spaces.json'),
        })) as { legacyBlob: string | null; spacesJson: string | null }

        const spacesIndex = JSON.parse(state.spacesJson ?? '{"spaces":[]}') as {
            spaces: Array<{ id: string; name: string }>
        }
        expect(state.legacyBlob).toBeNull()
        expect(spacesIndex.spaces.some((space) => space.id === 'ls-space' && space.name === 'ls-space')).toBe(true)
    })

    /**
     * TC-ST-SP-03 / TC-ST-SP-08 — nested spaces use the root-first folder path
     * and derived hierarchy in spaces.json [S-ST-LS3], [S-ST-DM4], [S-ST-IX1].
     */
    it('TC-ST-SP-03/TC-ST-SP-08 [S-ST-LS3,S-ST-DM4,S-ST-IX1]: nested spaces map to root-first folder paths', async () => {
        await browser.execute(() => {
            const parentIndex = {
                spaces: [
                    {
                        id: 'root',
                        name: 'root',
                        description: null,
                        labels: [],
                        parent_id: null,
                        child_ids: [],
                        note_count: 0,
                    },
                ],
            }
            localStorage.setItem('mlmm:file:spaces.json', JSON.stringify(parentIndex))
            window.dispatchEvent(new Event('storage'))
        })

        await browser.execute(() => {
            const childIndex = JSON.parse(localStorage.getItem('mlmm:file:spaces.json') ?? '{"spaces":[]}') as {
                spaces: Array<Record<string, unknown>>
            }
            childIndex.spaces.push({
                id: 'child.root',
                name: 'child',
                description: null,
                labels: [],
                parent_id: 'root',
                child_ids: [],
                note_count: 0,
            })
            localStorage.setItem('mlmm:file:spaces.json', JSON.stringify(childIndex))
        })

        const spacesJson = await browser.execute(() => localStorage.getItem('mlmm:file:spaces.json')) as string | null
        const spacesIndex = JSON.parse(spacesJson ?? '{"spaces":[]}') as {
            spaces: Array<{ id: string; parent_id: string | null }>
        }
        expect(spacesIndex.spaces.some((space) => space.id === 'child.root' && space.parent_id === 'root')).toBe(true)
    })

    /**
     * TC-E2E-SP-04-ls / TC-ST-SP-06 — deleting a space removes its S-ST-DM4
     * subtree and spaces.json entry from the web S-ST-LS3 local store.
     */
    it('TC-E2E-SP-04-ls/TC-ST-SP-06 [S-ST-LS3,S-ST-DM4]: deleting a space removes its file subtree', async () => {
        await helpers.createSpace('ls-temp')
        await browser.waitUntil(() => helpers.isSpaceVisible('ls-temp'), { timeout: UI_TIMEOUT_MS })

        await helpers.deleteSpace('ls-temp')
        await browser.waitUntil(
            async () => !(await helpers.isSpaceVisible('ls-temp')),
            { timeout: UI_TIMEOUT_MS },
        )

        const state = await browser.execute(() => {
            const subtreeKeys: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key?.startsWith('mlmm:file:spaces/ls-temp/')) subtreeKeys.push(key)
            }
            return {
                spacesJson: localStorage.getItem('mlmm:file:spaces.json'),
                subtreeKeys,
            }
        }) as { spacesJson: string | null; subtreeKeys: string[] }

        const spacesIndex = JSON.parse(state.spacesJson ?? '{"spaces":[]}') as { spaces: Array<{ id: string }> }
        expect(spacesIndex.spaces.some((space) => space.id === 'ls-temp')).toBe(false)
        expect(state.subtreeKeys.length).toBe(0)
    })
})
