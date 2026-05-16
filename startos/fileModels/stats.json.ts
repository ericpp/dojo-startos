import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  pairingCode: z.string(),
  adminKey: z.string(),
})

export type StatsJson = z.infer<typeof shape>

export const statsJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: 'stats.json',
  },
  shape,
)