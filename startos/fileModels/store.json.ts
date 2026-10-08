import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  bitcoinNode: z.enum(['bitcoind', 'bitcoind-testnet']).catch('bitcoind'),
  indexer: z.enum(['fulcrum', 'electrs']).catch('fulcrum'),
  paymentCode: z.string().nullable().catch(null),
  // Seeded by init/seedSecrets — empty means "not generated yet", never a
  // usable key. Generating one in a `.catch()` default would mint a fresh
  // secret per process and never persist it.
  adminKey: z.string().catch(''),
  apiKey: z.string().catch(''),
  jwtSecret: z.string().catch(''),
  sorobanAnnounce: z.boolean().catch(false),
  pandotxProcess: z.boolean().catch(false),
  pandotxPush: z.boolean().catch(true),
  pandotxRetries: z.number().int().min(0).max(10).catch(2),
  pandotxFallbackMode: z.enum(['convenient', 'secure']).catch('convenient'),
})

export type StoreJson = z.infer<typeof shape>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)
