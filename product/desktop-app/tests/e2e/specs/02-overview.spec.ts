/**
 * TC-E2E-OV — Overview screen tests
 *
 * Covers: TC-E2E-OV-01..03
 * Spec refs: @(S-UX-MF1,S-UX-SA2)
 *
 * Shared scenarios run here unchanged; desktop-specific behaviour (folder path
 * in status bar, Tauri capabilities) is validated in 01-first-launch.spec.ts.
 */

import { helpers } from '../helpers/app.js'
import { runOverviewSpec } from '../../../../e2e-shared/scenarios/overview.js'

describe('Overview', () => runOverviewSpec(helpers))
