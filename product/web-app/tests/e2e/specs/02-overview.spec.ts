/**
 * TC-E2E-OV — Overview screen tests (web)
 *
 * Covers: TC-E2E-OV-01..03
 * Spec refs: [S-UX-OV1], [S-UX-SA2]
 */

import { helpers } from '../helpers/app.js'
import { runOverviewSpec } from '../../../../e2e-shared/scenarios/overview.js'

describe('Overview', () => runOverviewSpec(helpers))
