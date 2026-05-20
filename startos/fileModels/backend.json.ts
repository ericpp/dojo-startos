import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  pairingCode: z.string().catch(''),
  adminKey: z.string().catch(''),
})

export type BackendJson = z.infer<typeof shape>

export const backendJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: 'backend.json',
  },
  shape,
)