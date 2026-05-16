import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { readFile, rm } from 'fs/promises'
import { storeJson } from '../fileModels/store.json'
import { generateKey } from '../utils'

export const v_1_29_2_0 = VersionInfo.of({
  version: '1.29.2:0',
  releaseNotes: {
    en_US: 'Initial release on StartOS SDK 0.4.0',
  },
  migrations: {
    up: async ({ effects }) => {
      const configYaml:
        | {
            'tor-address'?: string
            'bitcoin-node'?: {
              type: 'bitcoind' | 'bitcoind-testnet'
              username?: string
              password?: string
            }
            indexer?: { type: 'electrs' | 'fulcrum' }
            'payment-code'?: string | null
            'admin-key'?: string
            'api-key'?: string
            'jwt-secret'?: string
            'soroban-announce'?: {
              enabled: 'disabled' | 'enabled'
              'pandotx-process'?: boolean
            }
            'pandotx-push'?: boolean
            'pandotx-retries'?: number
            'pandotx-fallback-mode'?: 'convenient' | 'secure'
          }
        | undefined = await readFile(
        '/media/startos/volumes/main/start9/config.yaml',
        'utf-8',
      ).then(YAML.parse, () => undefined)

      if (configYaml) {
        await storeJson.write(effects, {
          bitcoinNode: configYaml['bitcoin-node'] || {
            type: 'bitcoind',
          },
          indexer: {
            type: configYaml.indexer?.type || 'electrs',
          },
          dojo: {
            paymentCode: configYaml['payment-code'] || null,
            adminKey: configYaml['admin-key'] || generateKey(22),
            apiKey: configYaml['api-key'] || generateKey(22),
            jwtSecret: configYaml['jwt-secret'] || generateKey(22),
            sorobanAnnounce: {
              enabled: configYaml['soroban-announce']?.enabled || 'disabled',
              pandotxProcess: configYaml['soroban-announce']?.['pandotx-process'] || false,
            },
            pandotxPush: configYaml['pandotx-push'] ?? true,
            pandotxRetries: configYaml['pandotx-retries'] ?? 2,
            pandotxFallbackMode: configYaml['pandotx-fallback-mode'] || 'convenient',
          },
          tor: {
            proxy: null,
            announceAddrs: [],
          },
        })

        await rm('/media/startos/volumes/main/start9', {
          recursive: true,
        }).catch(console.error)
      } else {
        // Fresh install with no prior config to migrate — write defaults so
        // docker_entrypoint.sh can source config.env without jq failing on a
        // missing store.json file (jq exits 2 when the file doesn't exist,
        // which kills the entrypoint immediately via `set -e`).
        await storeJson.write(effects, {
          bitcoinNode: { type: 'bitcoind' },
          indexer: { type: 'electrs' },
          dojo: {
            paymentCode: null,
            adminKey: generateKey(22),
            apiKey: generateKey(22),
            jwtSecret: generateKey(22),
            sorobanAnnounce: { enabled: 'disabled', pandotxProcess: false },
            pandotxPush: true,
            pandotxRetries: 2,
            pandotxFallbackMode: 'convenient',
          },
          tor: {
            proxy: null,
            announceAddrs: [],
          },
        })
      }
    },
    down: IMPOSSIBLE,
  },
})
