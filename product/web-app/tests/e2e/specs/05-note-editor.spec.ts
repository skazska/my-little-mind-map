/**
 * TC-E2E-NE — Note Editor tests (web)
 *
 * Covers: TC-E2E-NE-01..14, TC-E2E-NE-17
 * Spec refs: [S-UX-NVT3], [S-UX-NE1], [S-UX-NE2], [S-UX-NE3], [S-UX-NE4], [S-UX-NE6]
 *
 * TC-E2E-NE-01, 03–05, 08–13 run via the shared scenario.
 * TC-E2E-NE-02, 06, 14, 17 are web-specific and live in the second describe block.
 * TC-E2E-NE-07 (content preservation) is implicitly covered by TC-E2E-NE-06-web
 * (autosave round-trip via the S-ST-LS3 browser-local file tree).
 */

import { helpers, AUTOSAVE_DEBOUNCE_S, UI_TIMEOUT_MS } from '../helpers/app.js'
import { runNoteEditorSpec } from '../../../../e2e-shared/scenarios/note-editor.js'

type StoredFile = { key: string; value: string }

async function findStoredFileContaining(marker: string, suffix?: string): Promise<StoredFile | null> {
    return await browser.execute((needle: string, keySuffix: string | null) => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key?.startsWith('mlmm:file:spaces/ws-editor-space/')) continue
            if (keySuffix && !key.endsWith(keySuffix)) continue
            const value = localStorage.getItem(key)
            if (value?.includes(needle)) return { key, value }
        }
        return null
    }, marker, suffix ?? null) as StoredFile | null
}

function noteIdFromStoredFileKey(key: string): string {
    return key
        .slice('mlmm:file:spaces/'.length)
        .replace(/\/draft\.md$/, '')
        .replace(/\.md$/, '')
}

async function ensureWsEditorNoteList(): Promise<void> {
    const screen = await $('[data-screen]')
    const screenId = await screen.getAttribute('data-screen')
    if (screenId === 'note_list') return
    if (screenId === 'note_editor') {
        await helpers.clickBack()
        await helpers.assertScreen('note_list')
        return
    }
    if (screenId === 'overview') {
        await helpers.clickOverviewTab('spaces')
        await helpers.navigateIntoSpace('ws-editor-space')
        await helpers.assertScreen('note_list')
        return
    }
    throw new Error(`cannot navigate to ws-editor-space note list from screen ${screenId}`)
}

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
     * TC-E2E-NE-06-web / TC-ST-N-04 / TC-ST-LI-01 / TC-ST-LS3-01 / TC-ST-LS3-02 — Autosave writes a draft
     * markdown file and derived indexes in the S-ST-LS3 web local store.
     *
     * We verify the note content is persisted to a path-keyed localStorage file
     * whose path maps directly to the S-ST-DM4 folder-note layout.
     */
    it('TC-E2E-NE-06-web/TC-ST-N-04/TC-ST-LI-01/TC-ST-LS3-01/TC-ST-LS3-02 [S-ST-LS3,S-ST-DM3,S-ST-DM4,S-ST-IX1]: autosave writes draft markdown and indexes', async () => {
        await helpers.openNote('ws-test-note')
        const autosaveMarker = `autosave-web-${Date.now()}`
        await helpers.typeInEditor(autosaveMarker)

        // Wait for debounce + margin.
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 2) * 1_000)

        const storedFile = await findStoredFileContaining(autosaveMarker, '/draft.md')
        const state = await browser.execute(() => ({
            legacyBlob: localStorage.getItem('mlmm:data'),
            labelsJson: localStorage.getItem('mlmm:file:labels.json'),
            notesJson: localStorage.getItem('mlmm:file:notes.json'),
        })) as {
            legacyBlob: string | null
            labelsJson: string | null
            notesJson: string | null
        }
        const labelsIndex = JSON.parse(state.labelsJson ?? '{"entries":{}}') as { entries: Record<string, string[]> }
        const notesIndex = JSON.parse(state.notesJson ?? '{"notes":[]}') as {
            notes: Array<{ id: string; path: string; draft: boolean }>
        }
        const noteId = storedFile ? noteIdFromStoredFileKey(storedFile.key) : ''

        expect(state.legacyBlob).toBeNull()
        expect(storedFile?.key).toMatch(/^mlmm:file:spaces\/ws-editor-space\/untitled-\d+\/draft\.md$/)
        expect(storedFile?.value).toContain('---\n')
        expect(storedFile?.value).toContain('draft: true')
        expect(storedFile?.value).toContain(autosaveMarker)
        expect(labelsIndex.entries).toBeDefined()
        expect(notesIndex.notes.some((note) => (
            note.id === noteId
            && note.path === `${noteId}/draft.md`.replace(/^/, 'spaces/')
            && note.draft === true
        ))).toBe(true)
    })

    /**
     * TC-E2E-NE-13 / TC-DM-FM-09 / TC-ST-LS3-04 — publishing removes the S-DM-N7 draft file
     * and writes the published S-ST-DM4 markdown file with `draft: false`.
     */
    it('TC-E2E-NE-13/TC-DM-FM-09/TC-ST-LS3-04 [S-ST-LS3,S-DM-N7,S-ST-DM4]: publishing replaces draft file with published markdown', async () => {
        await ensureWsEditorNoteList()
        await helpers.createNote('ws-publish-layout')
        await helpers.typeInEditor('\nPublished body for layout check.')
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 2) * 1_000)

        await helpers.publishNote()

        await browser.waitUntil(async () => {
            const storedFile = await findStoredFileContaining('Published body for layout check.', '.md')
            if (!storedFile || storedFile.key.endsWith('/draft.md')) return false
            const noteId = noteIdFromStoredFileKey(storedFile.key)
            const draftFile = await browser.execute((id: string) => (
                localStorage.getItem(`mlmm:file:spaces/${id}/draft.md`)
            ), noteId) as string | null
            return draftFile === null && storedFile.value.includes('draft: false')
        }, { timeout: UI_TIMEOUT_MS })

        const storedFile = await findStoredFileContaining('Published body for layout check.', '.md')
        const noteId = storedFile ? noteIdFromStoredFileKey(storedFile.key) : ''
        const draftFile = await browser.execute((id: string) => (
            localStorage.getItem(`mlmm:file:spaces/${id}/draft.md`)
        ), noteId) as string | null

        expect(storedFile?.key).toMatch(/^mlmm:file:spaces\/ws-editor-space\/untitled-\d+\.md$/)
        expect(draftFile).toBeNull()
        expect(storedFile?.value).toContain('---\n')
        expect(storedFile?.value).toContain('draft: false')
        expect(storedFile?.value).toContain('Published body for layout check.')
    })

    /**
     * TC-ST-DI-01 — provisional definitions are derived from markdown content
     * into definitions.json [S-ST-LS3], [S-ST-IX1].
     */
    it('TC-ST-DI-01 [S-ST-LS3,S-ST-IX1]: definitions.json is derived from markdown note content', async () => {
        await ensureWsEditorNoteList()
        await helpers.createNote('ws-definition-layout')
        await helpers.typeInEditor('\n**Term** Definition from web markdown.')
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 2) * 1_000)

        const definitionsJson = await browser.execute(() => localStorage.getItem('mlmm:file:definitions.json')) as string | null
        const definitionsIndex = JSON.parse(definitionsJson ?? '{"entries":{}}') as {
            entries: Record<string, Array<{ note_id: string; definition: string }>>
        }

        expect(definitionsIndex.entries.term?.some((entry) => (
            entry.note_id.startsWith('ws-editor-space/untitled-')
            && entry.definition === 'Definition from web markdown.'
        ))).toBe(true)
    })

    /**
     * TC-E2E-NE-16 / TC-AL-N-12 / TC-ST-LS3-03 — clearing an existing draft removes the draft
     * markdown file from the S-ST-DM4 browser-local tree.
     */
    it('TC-E2E-NE-16/TC-AL-N-12/TC-ST-LS3-03 [S-ST-LS3,S-DM-N7,S-ST-DM4]: clearing content deletes the draft file', async () => {
        await ensureWsEditorNoteList()
        await helpers.createNote('ws-delete-draft-layout')
        await helpers.typeInEditor('\nDraft text to remove.')
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 2) * 1_000)

        const before = await findStoredFileContaining('Draft text to remove.', '/draft.md')
        const noteId = before ? noteIdFromStoredFileKey(before.key) : ''
        expect(before).not.toBeNull()

        const editor = await $('[data-testid="note-editor-content"]')
        await browser.execute((el: HTMLElement) => {
            const textarea = el as HTMLTextAreaElement
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
            nativeSetter?.call(textarea, '')
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
        }, editor)
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 2) * 1_000)

        const after = await browser.execute((id: string) => (
            localStorage.getItem(`mlmm:file:spaces/${id}/draft.md`)
        ), noteId) as string | null

        expect(after).toBeNull()
    })

    /**
     * TC-ST-N-02 / TC-ST-N-04 — the markdown note path is exact and no legacy
     * flat JSON blob is used [S-ST-LS3], [S-ST-DM3], [S-ST-DM4].
     */
    it('TC-ST-N-02/TC-ST-N-04 [S-ST-LS3,S-ST-DM3,S-ST-DM4]: saved note uses exact markdown file key', async () => {
        await ensureWsEditorNoteList()
        await helpers.createNote('ws-exact-file-key')
        await helpers.typeInEditor('\nExact file key body.')
        await helpers.saveNote()

        const state = await browser.execute(() => {
            const keys: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                const value = key ? localStorage.getItem(key) : null
                if (
                    key?.startsWith('mlmm:file:spaces/ws-editor-space/')
                    && value?.includes('Exact file key body.')
                ) keys.push(key)
            }
            return {
                keys,
                markdownFile: keys.length === 1 ? localStorage.getItem(keys[0]) : null,
                legacyBlob: localStorage.getItem('mlmm:data'),
            }
        }) as { keys: string[]; markdownFile: string | null; legacyBlob: string | null }

        expect(state.keys).toHaveLength(1)
        expect(state.keys[0]).toMatch(/^mlmm:file:spaces\/ws-editor-space\/untitled-\d+\/draft\.md$/)
        expect(state.markdownFile).toContain('title: "ws-exact-file-key"')
        expect(state.markdownFile).toContain('Exact file key body.')
        expect(state.legacyBlob).toBeNull()
    })

    /**
     * TC-ST-LS3-06 — nested note draft and published keys mirror the S-ST-DM4
     * folder-note layout in the S-ST-LS3 web local store.
     */
    it('TC-ST-LS3-06 [S-ST-LS3,S-ST-DM4]: nested note draft and publish use folder-note keys', async () => {
        await ensureWsEditorNoteList()
        await helpers.createNote('ws-nested-parent')
        await helpers.typeInEditor('\nParent body for nested layout.')
        await helpers.saveNote()

        await browser.waitUntil(async () => (
            await findStoredFileContaining('Parent body for nested layout.', '/draft.md')
        ) !== null, { timeout: UI_TIMEOUT_MS })

        const parentStoredFile = await findStoredFileContaining('Parent body for nested layout.', '/draft.md')
        const parentNoteId = parentStoredFile ? noteIdFromStoredFileKey(parentStoredFile.key) : ''
        expect(parentNoteId).toMatch(/^ws-editor-space\/untitled-\d+$/)

        const nestedState = await browser.execute(async (parentId: string) => {
            type StorageModule = { executeStorageEffect: (req: Record<string, unknown>) => unknown }
            const storage = await (Function('return import("/src/browserStorage.ts")')() as Promise<StorageModule>)
            const now = new Date().toISOString()
            const childId = `${parentId}/ws-nested-child`
            const draftNote = {
                id: childId,
                metadata: {
                    uuid: '00000000-0000-4000-8000-000000000006',
                    title: 'ws-nested-child',
                    space: 'ws-editor-space',
                    labels: [],
                    references: [],
                    created_at: now,
                    updated_at: now,
                    draft: true,
                },
                content: '# ws-nested-child\n\nNested draft body.',
                parent_id: parentId,
            }
            storage.executeStorageEffect({ op: 'save_note', note: draftNote })

            const draftKey = `mlmm:file:spaces/${childId}/draft.md`
            const draftFile = localStorage.getItem(draftKey)
            const publishedNote = {
                ...draftNote,
                metadata: {
                    ...draftNote.metadata,
                    updated_at: new Date().toISOString(),
                    draft: false,
                },
                content: '# ws-nested-child\n\nNested published body.',
            }
            storage.executeStorageEffect({ op: 'save_note', note: publishedNote })

            const publishedKey = `mlmm:file:spaces/${childId}.md`
            const nestedKeys: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key?.startsWith(`mlmm:file:spaces/${childId}`)) nestedKeys.push(key)
            }

            return {
                childId,
                draftKey,
                draftFile,
                draftAfterPublish: localStorage.getItem(draftKey),
                publishedKey,
                publishedFile: localStorage.getItem(publishedKey),
                nestedKeys: nestedKeys.sort(),
            }
        }, parentNoteId) as {
            childId: string
            draftKey: string
            draftFile: string | null
            draftAfterPublish: string | null
            publishedKey: string
            publishedFile: string | null
            nestedKeys: string[]
        }

        expect(nestedState.childId).toBe(`${parentNoteId}/ws-nested-child`)
        expect(nestedState.draftKey).toBe(`mlmm:file:spaces/${parentNoteId}/ws-nested-child/draft.md`)
        expect(nestedState.draftFile).toContain('draft: true')
        expect(nestedState.draftFile).toContain('Nested draft body.')
        expect(nestedState.draftAfterPublish).toBeNull()
        expect(nestedState.publishedKey).toBe(`mlmm:file:spaces/${parentNoteId}/ws-nested-child.md`)
        expect(nestedState.publishedFile).toContain('draft: false')
        expect(nestedState.publishedFile).toContain('Nested published body.')
        expect(nestedState.nestedKeys).toEqual([nestedState.publishedKey])
    })

    /**
     * TC-E2E-NE-14-web — Publish shows a confirmation dialog before formatting.
     */
    it('TC-E2E-NE-14-web: Publish action shows a confirmation dialog', async () => {
        await ensureWsEditorNoteList()
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

    /**
     * TC-E2E-NE-17-web — Editor command syntax is not persisted [S-UX-NE2], [S-DM-N2]
     */
    it('TC-E2E-NE-17-web [S-ST-LS3,S-ST-DM3,S-ST-DM4]: /:labels command syntax is stripped before markdown persistence', async () => {
        await ensureWsEditorNoteList()
        await helpers.createNote('ws-command-syntax-note')

        await helpers.typeInEditor('\n/:labels command-label;\nBody after command.')
        await helpers.saveNote()

        const storedFile = await findStoredFileContaining('ws-command-syntax-note')
        const persisted = storedFile?.value ?? ''

        expect(persisted).not.toContain('/:labels')
        expect(persisted).toContain('command-label')
        expect(persisted).toContain('Body after command.')
    })
})
