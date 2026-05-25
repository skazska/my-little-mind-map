/**
 * WebdriverIO configuration for web app E2E tests.
 *
 * Prerequisites (run once):
 *   cd product/web-app && npm install
 *
 * Usage:
 *   just e2e-web                         # build wasm + run E2E tests
 *   cd product/web-app && npm run test:e2e  # run tests (wasm must be pre-built)
 *
 * The Vite dev server is spawned automatically in onPrepare and torn down in onComplete.
 * Tests use Chrome via chromedriver (no Tauri involvement).
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** product/web-app directory */
const WEB_APP_DIR = path.resolve(__dirname, '..', '..')

/** Port on which the Vite dev server listens. */
const VITE_PORT = 3000

let viteProcess: ChildProcess | undefined

/**
 * Wait for Vite to be ready (polls TCP port until connectable).
 */
async function waitForVite(port: number, timeoutMs = 30_000): Promise<void> {
    const net = await import('node:net')
    const deadline = Date.now() + timeoutMs
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const socket = net.createConnection(port, '127.0.0.1')
            socket.once('connect', () => {
                socket.destroy()
                resolve()
            })
            socket.once('error', () => {
                socket.destroy()
                if (Date.now() < deadline) {
                    setTimeout(attempt, 250)
                } else {
                    reject(new Error(`Vite dev server did not start on port ${port} within ${timeoutMs}ms`))
                }
            })
        }
        attempt()
    })
}

export const config: WebdriverIO.Config = {
    // ── Runner ────────────────────────────────────────────────────────────────
    runner: 'local',
    port: 4445,

    // ── Specs ─────────────────────────────────────────────────────────────────
    specs: [path.join(__dirname, 'specs', '**', '*.spec.ts')],
    maxInstances: 1,

    // ── Capabilities ─────────────────────────────────────────────────────────
    capabilities: [
        {
            browserName: 'chrome',
            'wdio:enforceWebDriverClassic': true,
            'goog:chromeOptions': {
                args: ['--no-sandbox', '--disable-dev-shm-usage'],
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

    // ── Base URL ─────────────────────────────────────────────────────────────
    baseUrl: `http://localhost:${VITE_PORT}`,

    // ── Services ─────────────────────────────────────────────────────────────
    services: [['chromedriver', { logFileName: 'wdio-chromedriver.log' }]],

    // ── Lifecycle hooks ───────────────────────────────────────────────────────

    /**
     * Spawn the Vite dev server before the session starts.
     */
    async onPrepare() {
        viteProcess = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort'], {
            cwd: WEB_APP_DIR,
            stdio: 'pipe',
            env: { ...process.env, BROWSER: 'none' },
        })
        viteProcess.stderr?.on('data', (d: Buffer) => process.stderr.write(d))
        await waitForVite(VITE_PORT)
        console.log(`[wdio] Vite dev server ready on port ${VITE_PORT}`)
    },

    /**
     * Kill the Vite dev server after the session ends.
     */
    async onComplete() {
        if (viteProcess) {
            viteProcess.kill('SIGTERM')
            viteProcess = undefined
        }
    },

    /**
     * Before each test suite, navigate to the app root and clear MLMM
     * localStorage keys so each suite starts from a clean state.
     */
    async beforeSuite() {
        await browser.url('/')
        // Wait for the app to hydrate
        await browser.waitUntil(
            async () => {
                const el = await $('[data-screen]')
                return el.isExisting()
            },
            { timeout: 10_000, timeoutMsg: 'App did not render within 10 s' },
        )
        // Clear MLMM-specific localStorage keys
        await browser.execute(() => {
            const toRemove: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith('mlmm:')) toRemove.push(key)
            }
            toRemove.forEach((k) => localStorage.removeItem(k))
        })
        await browser.refresh()
        await browser.waitUntil(
            async () => {
                const el = await $('[data-screen]')
                return el.isExisting()
            },
            { timeout: 10_000 },
        )
    },
}
