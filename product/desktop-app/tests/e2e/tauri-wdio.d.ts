/**
 * Extend WebdriverIO capability types to include Tauri-specific vendor options.
 * `tauri:options` is a W3C-compliant vendor-prefixed capability used by
 * tauri-driver (https://tauri.app/v2/guides/testing/webdriver).
 */
declare namespace WebdriverIO {
    interface Capabilities {
        'tauri:options'?: {
            application: string
        }
    }
}
