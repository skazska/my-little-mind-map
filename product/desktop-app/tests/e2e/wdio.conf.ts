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

const ROOT = path.resolve(__dirname, '..', '..')

/** Path to the compiled Tauri binary. */
const APP_BINARY = path.join(
    ROOT,
    'src-tauri',
    'target',
    'release',
    os.platform() === 'win32' ? 'desktop-app.exe' : 'desktop-app',
)

let tauriDriver: ChildProcess

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
            maxInstances: 1,
            // Tauri apps use the `wry` browser name.
            browserName: 'wry',
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

    // ── TS transpilation ──────────────────────────────────────────────────────
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            project: path.join(ROOT, 'tsconfig.json'),
            transpileOnly: true,
        },
    },

    // ── Lifecycle hooks ───────────────────────────────────────────────────────

    /**
     * Start `tauri-driver` before the test session.
     * `tauri-driver` wraps the platform WebDriver (e.g. WebKitWebDriver / WPEWebDriver)
     * and exposes a WebDriver endpoint on port 4444.
     */
    onPrepare: () => {
        tauriDriver = spawn('tauri-driver', [], {
            stdio: [null, process.stdout, process.stderr],
        })
    },

    /** Clean up tauri-driver after all tests complete. */
    onComplete: () => {
        if (tauriDriver) tauriDriver.kill()
    },

    /**
     * Before each test suite: create a temporary data directory and export its
     * path so the app helper can pass it to the Tauri app.
     */
    beforeSuite: (suite) => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mlmm-e2e-'))
        process.env['E2E_DATA_DIR'] = tmpDir
    },

    /**
     * After each suite: remove the temporary data directory.
     */
    afterSuite: (suite) => {
        const dir = process.env['E2E_DATA_DIR']
        if (dir && fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    },
}
