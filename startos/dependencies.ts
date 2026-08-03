import { autoconfig } from 'bitcoin-core-startos/startos/actions/config/autoconfig'
import { autoconfig as autoconfigTestnet } from 'bitcoind-testnet4-startos/startos/actions/config/autoconfig'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'

/** Dojo reads raw transactions over RPC and subscribes to blocks over ZeroMQ,
 * neither of which a pruned or unindexed node can serve. */
const bitcoinTask = {
  input: {
    kind: 'partial' as const,
    accept: [{ prune: 0, txindex: true, zmqEnabled: true }],
    set: { prune: 0, txindex: true, zmqEnabled: true },
  },
  when: { condition: 'input-not-matches' as const, once: false },
  reason: i18n(
    'Dojo needs pruning disabled and txindex and ZeroMQ enabled in Bitcoin',
  ),
}

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const config = await storeJson
    .read((s) => ({ bitcoinNode: s.bitcoinNode, indexer: s.indexer }))
    .const(effects)

  const testnet = config?.bitcoinNode === 'bitcoind-testnet'
  await sdk.action.createTask(
    effects,
    testnet ? 'bitcoind-testnet' : 'bitcoind',
    testnet ? autoconfigTestnet : autoconfig,
    'critical',
    bitcoinTask,
  )

  return {
    tor: {
      kind: 'running',
      versionRange: '^0.4.9.11:4',
      healthChecks: ['tor'],
    },
    ...(testnet
      ? {
          'bitcoind-testnet': {
            kind: 'running',
            versionRange: '>=31.1:0',
            healthChecks: ['bitcoind'],
          },
        }
      : {
          bitcoind: {
            // Dojo exits on any node whose subversion contains "Knots"
            // (lib/bitcoind-rpc/rpc-client.js), so both Knots flavors are
            // excluded here rather than left to crash-loop the accounts API out
            // of sight. Excluded by flavor, not by a version floor: Knots
            // tracks Core's majors, so a floor above its current line stops
            // excluding it the moment it catches up.
            kind: 'running',
            versionRange:
              '((>=28.4:17 && <29) || (>=29.4:4 && <30) || (>=30.3:4 && <31) || >=31.1:4) && !#knots && !#knotsprerdts',
            healthChecks: ['bitcoind'],
          },
        }),
    // The indexer only has to be answering, not fully indexed — Dojo reports
    // its own import progress, and blocking startup on a first index would
    // leave the service unavailable for hours.
    ...(config?.indexer === 'electrs'
      ? {
          electrs: {
            kind: 'running',
            versionRange: '>=0.11.1:16',
            healthChecks: ['electrs'],
          },
        }
      : {
          fulcrum: {
            kind: 'running',
            versionRange: '>=2.1.1:10',
            healthChecks: ['primary'],
          },
        }),
  }
})
