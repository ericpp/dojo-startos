import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

/**
 * Written by the backend daemon's entrypoint, read by the View Pairing Code
 * action. The pairing payload is assembled in the container because it embeds
 * Dojo's own version tag, which only the image knows.
 */
const shape = z.looseObject({
  pairingCode: z.string().catch(''),
})

export const backendJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'backend.json' },
  shape,
)
