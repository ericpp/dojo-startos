import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { generateKey } from '../utils'

const shape = z.object({
  bitcoinNode: z
    .object({
      type: z.enum(['bitcoind', 'bitcoind-testnet']).catch('bitcoind'),
    })
    .catch({ type: 'bitcoind' }),
  indexer: z
    .object({
      type: z.enum(['fulcrum', 'electrs']).catch('electrs'),
    })
    .catch({ type: 'electrs' }),
  dojo: z
    .object({
      paymentCode: z.string().nullable().catch(null),
      adminKey: z.string().catch(''),
      apiKey: z.string().catch(''),
      jwtSecret: z.string().catch(''),
      sorobanAnnounce: z
        .object({
          enabled: z.enum(['disabled', 'enabled']).catch('disabled'),
          pandotxProcess: z.boolean().catch(false),
        })
        .catch({ enabled: 'disabled', pandotxProcess: false }),
      pandotxPush: z.boolean().catch(true),
      pandotxRetries: z.number().catch(2),
      pandotxFallbackMode: z.enum(['convenient', 'secure']).catch('convenient'),
    })
    .catch({
      paymentCode: null,
      adminKey: generateKey(22),
      apiKey: generateKey(22),
      jwtSecret: generateKey(22),
      sorobanAnnounce: { enabled: 'disabled', pandotxProcess: false },
      pandotxPush: true,
      pandotxRetries: 2,
      pandotxFallbackMode: 'convenient',
    }),
  tor: z
    .object({
      proxy: z.string().nullable().catch(null),
      announceAddrs: z.array(z.string()).nullable().catch([]),
    })
    .catch({ proxy: null, announceAddrs: [] }),
})

export type StoreJson = z.infer<typeof shape>

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: 'store.json',
  },
  shape,
)