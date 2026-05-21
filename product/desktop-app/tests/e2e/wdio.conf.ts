/**
 * WebdriverIO configuration for Tauri E2E tests.
 *
 * Prerequisites (run once):
 *   cargo install tauri-driver
 *
 * Usage:
 *   just e2e                    # build + run all E2E tests
 *   npx wdio tests/e2e/wdio.conf.ts   # run tests (app must be pre-built)
 *
 * Ref: https://tauri.app/v2/guides/testing/webdriver/introduction
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Workspace root (four levels up from tests/e2e). */
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..', '..')

/** Path to the compiled Tauri binary (built to workspace-level target/). */
const APP_BINARY = path.join(
    WORKSPACE_ROOT,
    'target',
    'release',
    os.platform() === 'win32' ? 'desktop-app.exe' : 'desktop-app',
)

let tauriDriver: ChildProcess

/** Temporary XDG_CONFIG_HOME used by the app process during E2E runs.
 *  Stored here so `onComplete` can remove it. */
let e2eXdgConfigHome: string | undefined

export const config: WebdriverIO.Config = {
    // ── Runner ────────────────────────────────────────────────────────────────
    runner: 'local',
    port: 4444,

    // ── Specs ─────────────────────────────────────────────────────────────────
    specs: [path.join(__dirname, 'specs', '**', '*.spec.ts')],
    maxInstances: 1,

    // ── Capabilities ─────────────────────────────────────────────────────────
    capabilities: [
        {
            // Tauri apps use the `wry` browser name.
            browserName: 'wry',
            // Disable WebdriverIO's BiDi (webSocketUrl) auto-injection.
            // WebKitWebDriver on Linux does not support BiDi and rejects
            // sessions that request it with "Failed to match capabilities".
            'wdio:enforceWebDriverClassic': true,
            'tauri:options': {
                application: APP_BINARY,
            },
        },
    ],

    // ── Framework ─────────────────────────────────────────────────────────────
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60_000,
    },

    // ── Reporters ─────────────────────────────────────────────────────────────
    reporters: ['spec'],

    // ── Lifecycle hooks ───────────────────────────────────────────────────────

    /**
     * Start `tauri-driver` before the test session.
     * `tauri-driver` wraps the platform WebDriver (e.g. WebKitWebDriver / WPEWebDriver)
     * and exposes a WebDriver endpoint on port 4444.
     */
    onPrepare: () => {
        // Create a fresh, isolated config home so the app never reads the
        // developer's real config (which would have a stored data_folder and
        // cause first-launch tests to be skipped).
        e2eXdgConfigHome = fs.mkdtempSync(path.join(os.tmpdir(), 'mlmm-e2e-xdg-'))
        process.env['E2E_XDG_CONFIG_HOME'] = e2eXdgConfigHome

        tauriDriver = spawn('tauri-driver', [], {
            stdio: [null, process.stdout, process.stderr],
            env: { ...process.env, XDG_CONFIG_HOME: e2eXdgConfigHome },
        })
        // Give tauri-driver time to start WebKitWebDriver and bind port 4444.
        return new Promise((resolve) => setTimeout(resolve, 2000))
    },

    /** Clean up tauri-driver and the temporary XDG config dir after all tests. */
    onComplete: () => {
        if (tauriDriver) tauriDriver.kill()
        if (e2eXdgConfigHome && fs.existsSync(e2eXdgConfigHome)) {
            fs.rmSync(e2eXdgConfigHome, { recursive: true, force: true })
        }
    },

    /**
     * Before each test suite: create a temporary data directory and export its
     * path so the app helper can pass it to the Tauri app.
     */
    beforeSuite: (_suite) => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mlmm-e2e-'))
        process.env['E2E_DATA_DIR'] = tmpDir
    },

    /**
     * After each suite: remove the temporary data directory.
     */
    afterSuite: (_suite) => {
        const dir = process.env['E2E_DATA_DIR']
        if (dir && fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    },
}
