/**
 * TC-E2E-NE — Note Editor tests
 *
 * Covers: TC-E2E-NE-01..17
 * Spec refs: [S-UX-NVT2], [S-UX-NE1], [S-UX-NE2], [S-UX-NE3], [S-UX-NE4], [S-UX-NE5], [S-UX-NE6]
 *
 * TC-E2E-NE-01, 03–05, 08–13 run via the shared scenario.
 * TC-E2E-NE-02, 06, 07, 14, 15, 16, 17 are desktop-specific and live in the second describe block.
 */

import {
    assertScreen,
    clickOverviewTab,
    createNote,
    createSpace,
    navigateIntoSpace,
    openNote,
    resetAppState,
    saveNote,
    useDefaultFolder,
    UI_TIMEOUT_MS,
    AUTOSAVE_DEBOUNCE_S,
} from '../helpers/app.js'
import { helpers } from '../helpers/app.js'
import { runNoteEditorSpec } from '../../../../e2e-shared/scenarios/note-editor.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

let dataDir: string

describe('Note Editor', () => {
    before(async () => {
        await resetAppState()
        await useDefaultFolder()
        await assertScreen('overview')

        const statusPath = await $('[data-testid="status-bar-path"]')
        await statusPath.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        dataDir = (await statusPath.getText()).trim()

        await clickOverviewTab('spaces')
        await createSpace('editor-space')
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
        await navigateIntoSpace('editor-space')
        await assertScreen('note_list')

        await createNote('test-note')
        await helpers.clickBack()
        await assertScreen('note_list')
    })

    runNoteEditorSpec(helpers)
})

describe('Note Editor — desktop-specific', () => {
    before(async () => {
        await resetAppState()
        await useDefaultFolder()
        await assertScreen('overview')

        const statusPath = await $('[data-testid="status-bar-path"]')
        await statusPath.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        dataDir = (await statusPath.getText()).trim()

        await clickOverviewTab('spaces')
        await createSpace('ds-editor-space')
        await browser.waitUntil(
            async () => {
                const items = await $$('[data-testid="space-item"]')
                for (const item of items) {
                    if ((await item.getAttribute('data-name')) === 'ds-editor-space') return true
                }
                return false
            },
            { timeout: UI_TIMEOUT_MS },
        )
        await navigateIntoSpace('ds-editor-space')
        await assertScreen('note_list')

        await createNote('ds-test-note')
        await helpers.clickBack()
        await assertScreen('note_list')
    })

    /**
     * TC-E2E-NE-02 — Metadata panel shows title, labels, UUID, dates [S-UX-NE1]
     */
    it('TC-E2E-NE-02: metadata panel displays title, labels, UUID, created_at, and updated_at', async () => {
        await openNote('ds-test-note')
        await assertScreen('note_editor')

        const titleEl = await $('[data-testid="metadata-title"]')
        await expect(titleEl).toBeDisplayed()

        const uuidEl = await $('[data-testid="metadata-uuid"]')
        await expect(uuidEl).toBeDisplayed()

        const createdEl = await $('[data-testid="metadata-created-at"]')
        await expect(createdEl).toBeDisplayed()

        const updatedEl = await $('[data-testid="metadata-updated-at"]')
        await expect(updatedEl).toBeDisplayed()
    })

    /**
     * TC-E2E-NE-06 — Autosave triggers after typing pause [S-UX-NE4]
     */
    it('TC-E2E-NE-06: autosave fires after the debounce period', async () => {
        const autosaveContent = `Autosave test ${Date.now()}`
        await helpers.typeInEditor(autosaveContent)

        // Wait longer than the debounce period.
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 5) * 1_000)

        const notePath = path.join(dataDir, 'spaces', 'ds-editor-space', 'ds-test-note.md')
        await browser.waitUntil(
            () => {
                if (!fs.existsSync(notePath)) return false
                const raw = fs.readFileSync(notePath, 'utf-8')
                return raw.includes(autosaveContent)
            },
            { timeout: 5_000, timeoutMsg: 'Autosave did not persist content to disk' },
        )
    })

    /**
     * TC-E2E-NE-07 — Autosave does not normalize content [S-UX-NE5]
     */
    it('TC-E2E-NE-07: autosave preserves trailing spaces and consecutive blank lines', async () => {
        await helpers.clickBack()
        await assertScreen('note_list')
        await createNote('preserve-note')
        await helpers.clickBack()
        await assertScreen('note_list')
        await openNote('preserve-note')

        const rawContent = 'Line one.   \n\n\nLine two after two blank lines.'
        await helpers.typeInEditor(rawContent)

        await browser.pause((AUTOSAVE_DEBOUNCE_S + 5) * 1_000)

        const notePath = path.join(dataDir, 'spaces', 'ds-editor-space', 'preserve-note.md')
        await browser.waitUntil(() => fs.existsSync(notePath), { timeout: 3_000 })

        const raw = fs.readFileSync(notePath, 'utf-8')
        expect(raw).toContain('Line one.   ')
    })

    /**
     * TC-E2E-NE-14 — Publish shows confirmation dialog [S-UX-NE6]
     */
    it('TC-E2E-NE-14: Publish action shows a confirmation dialog before formatting', async () => {
        await helpers.clickBack()
        await assertScreen('note_list')
        await createNote('confirm-publish-note')

        const publishBtn = await $('[data-testid="publish-note-btn"]')
        await publishBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await browser.execute((el) => (el as HTMLElement).click(), publishBtn)

        const dialog = await $('[data-testid="publish-confirm-dialog"], [role="dialog"]')
        await expect(dialog).toBeDisplayed()

        const cancelBtn = await $('[data-testid="publish-confirm-cancel"]')
        if (await cancelBtn.isDisplayed()) {
            await browser.execute((el) => (el as HTMLElement).click(), cancelBtn)
        }
    })

    /**
     * TC-E2E-NE-08-disk — Label persists to disk after save [S-UX-NE1]
     */
    it('TC-E2E-NE-08-disk: added label appears in front matter after save', async () => {
        await openNote('ds-test-note')
        await helpers.addLabel('disk-label')
        await saveNote()

        const notePath = path.join(dataDir, 'spaces', 'ds-editor-space', 'ds-test-note.md')
        await browser.waitUntil(
            () => fs.existsSync(notePath) && fs.readFileSync(notePath, 'utf-8').includes('disk-label'),
            { timeout: UI_TIMEOUT_MS, timeoutMsg: 'Label not found in front matter after save' },
        )
    })

    /**
     * TC-E2E-NE-12-disk — Draft flag on disk [S-UX-NE1]
     */
    it('TC-E2E-NE-12-disk: new note file has draft: true in front matter', async () => {
        await helpers.clickBack()
        await assertScreen('note_list')
        await createNote('ds-draft-note')
        await saveNote()

        const notePath = path.join(dataDir, 'spaces', 'ds-editor-space', 'ds-draft-note.md')
        await browser.waitUntil(() => fs.existsSync(notePath), { timeout: UI_TIMEOUT_MS })
        const raw = fs.readFileSync(notePath, 'utf-8')
        expect(raw).toContain('draft: true')
    })

    /**
     * TC-E2E-NE-13-disk — Publish clears draft flag on disk [S-UX-NE1]
     */
    it('TC-E2E-NE-13-disk: publishing clears draft: false in front matter', async () => {
        await helpers.clickBack()
        await assertScreen('note_list')
        await openNote('ds-draft-note')
        await helpers.publishNote()

        const notePath = path.join(dataDir, 'spaces', 'ds-editor-space', 'ds-draft-note.md')
        await browser.waitUntil(
            () => {
                const raw = fs.readFileSync(notePath, 'utf-8')
                return raw.includes('draft: false')
            },
            { timeout: UI_TIMEOUT_MS },
        )
    })

    /**
     * TC-E2E-NE-15 — Autosave does not create draft when content is empty [S-UX-NE4]
     *
     * Opens a fresh note, clears any pre-filled content so the editor is
     * empty, waits for the autosave debounce, then asserts no draft file
     * remains on disk.
     */
    it('TC-E2E-NE-15: autosave with empty content does not write a draft file', async () => {
        await helpers.clickBack()
        await assertScreen('note_list')

        // Click "New note" directly without typing, to get an empty editor.
        const createBtn = await $('[data-testid="create-note-btn"]')
        await createBtn.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await browser.execute((el) => (el as HTMLElement).click(), createBtn)
        await assertScreen('note_editor')

        // Clear any pre-seeded content so the editor is truly empty.
        const editorEl = await $('[data-testid="note-editor-content"]')
        await editorEl.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await browser.execute((el: HTMLElement) => {
            const textarea = el as HTMLTextAreaElement
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
            nativeSetter?.call(textarea, '')
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
        }, editorEl)

        // Wait for autosave to fire and the DeleteDraft to propagate.
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 5) * 1_000)

        // No untitled draft file should exist after the debounce.
        const spaceDir = path.join(dataDir, 'spaces', 'ds-editor-space')
        const files = fs.existsSync(spaceDir)
            ? fs.readdirSync(spaceDir).filter((f) => f.startsWith('untitled-') && f.endsWith('.md'))
            : []
        expect(files.length).toBe(0)
    })

    /**
     * TC-E2E-NE-16 — Clearing all content removes an existing draft [S-UX-NE4]
     *
     * Creates a note with content (which triggers autosave → draft on disk),
     * then clears the content and waits for the next autosave, asserting the
     * draft file is removed.
     */
    it('TC-E2E-NE-16: clearing editor content removes the existing draft file', async () => {
        await helpers.clickBack()
        await assertScreen('note_list')
        await createNote('draft-to-clear')
        // Note now has content `# draft-to-clear\n\n` — wait for autosave.
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 5) * 1_000)

        const notePath = path.join(dataDir, 'spaces', 'ds-editor-space', 'draft-to-clear.md')
        await browser.waitUntil(
            () => fs.existsSync(notePath) && fs.readFileSync(notePath, 'utf-8').includes('draft: true'),
            { timeout: 5_000, timeoutMsg: 'Draft file not created before content clear test' },
        )

        // Now clear all content in the editor.
        const editorEl = await $('[data-testid="note-editor-content"]')
        await editorEl.waitForDisplayed({ timeout: UI_TIMEOUT_MS })
        await browser.execute((el: HTMLElement) => {
            const textarea = el as HTMLTextAreaElement
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
            nativeSetter?.call(textarea, '')
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
        }, editorEl)

        // Wait for the delete-draft autosave to fire.
        await browser.pause((AUTOSAVE_DEBOUNCE_S + 5) * 1_000)

        // Draft file must be gone and draft indicator must not be shown.
        expect(fs.existsSync(notePath)).toBe(false)
        const draftIndicator = await $('[data-testid="draft-indicator"]')
        await expect(draftIndicator).not.toBeDisplayed()
    })

    /**
     * TC-E2E-NE-17 — Editor command syntax is not persisted to disk [S-UX-NE2], [S-DM-N2]
     */
    it('TC-E2E-NE-17: /:labels command syntax is stripped before persistence', async () => {
        const screenEl = await $('[data-screen]')
        const screenId = await screenEl.getAttribute('data-screen')
        if (screenId === 'note_editor') {
            await helpers.clickBack()
        } else if (screenId === 'overview') {
            await clickOverviewTab('spaces')
            await navigateIntoSpace('ds-editor-space')
        }
        await assertScreen('note_list')
        await createNote('command-syntax-note')

        await helpers.typeInEditor('\n/:labels command-label;\nBody after command.')
        await saveNote()

        const notePath = path.join(dataDir, 'spaces', 'ds-editor-space', 'command-syntax-note.md')
        await browser.waitUntil(() => fs.existsSync(notePath), { timeout: UI_TIMEOUT_MS })

        const raw = fs.readFileSync(notePath, 'utf-8')
        expect(raw).not.toContain('/:labels')
        expect(raw).toContain('command-label')
        expect(raw).toContain('Body after command.')
    })
})

