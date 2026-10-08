import { T } from '@start9labs/start-sdk'
import { autoconfig } from 'bitcoin-core-startos/startos/actions/config/autoconfig'
import { autoconfig as autoconfigTestnet } from 'bitcoind-testnet4-startos/startos/actions/config/autoconfig'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import {
  bitcoinDescription,
  bitcoinTestnetDescription,
  indexerDescription,
  torDescription,
} from './manifest/i18n'
import { sdk } from './sdk'

const bitcoinNode = (effects: T.Effects) =>
  storeJson.read((s) => s.bitcoinNode).const(effects)

const indexer = (effects: T.Effects) =>
  storeJson.read((s) => s.indexer).const(effects)

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

const tor = sdk.Dependency.required('tor', {
  description: torDescription,
  metadata: {
    title: 'Tor',
    icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/refs/heads/master/icon.svg',
  },
  versionRange: '^0.4.9.11:4',
  kind: 'running',
  healthChecks: ['tor'],
})

const bitcoind = sdk.Dependency.optional('bitcoind', {
  description: bitcoinDescription,
  metadata: {
    title: 'Bitcoin',
    icon: 'https://raw.githubusercontent.com/Start9Labs/bitcoin-core-startos/refs/heads/31.x/dep-icon.svg',
  },
  // Dojo exits on any node whose subversion contains "Knots" (lib/bitcoind-rpc/rpc-client.js).
  versionRange:
    '((>=28.4:29 && <29) || (>=29.4:16 && <30) || (>=30.3:16 && <31) || >=31.1:16) && !#knots && !#knotsprerdts',
  kind: 'running',
  healthChecks: ['bitcoind'],
  enabled: async ({ effects }) =>
    (await bitcoinNode(effects)) !== 'bitcoind-testnet',
}).withInit(async (effects) => {
  await sdk.action.createTask(
    effects,
    'bitcoind',
    autoconfig,
    'critical',
    bitcoinTask,
  )
})

const bitcoindTestnet = sdk.Dependency.optional('bitcoind-testnet', {
  description: bitcoinTestnetDescription,
  metadata: {
    title: 'Bitcoin (testnet4)',
    icon: 'https://raw.githubusercontent.com/remcoros/bitcoind-testnet4-startos/refs/heads/31.x-testnet4/dep-icon.svg',
  },
  versionRange: '>=31.1:0',
  kind: 'running',
  healthChecks: ['bitcoind'],
  enabled: async ({ effects }) =>
    (await bitcoinNode(effects)) === 'bitcoind-testnet',
}).withInit(async (effects) => {
  await sdk.action.createTask(
    effects,
    'bitcoind-testnet',
    autoconfigTestnet,
    'critical',
    bitcoinTask,
  )
})

// The indexer only has to be answering, not fully indexed — Dojo reports its
// own import progress, and blocking startup on a first index would leave the
// service unavailable for hours.
const fulcrum = sdk.Dependency.optional('fulcrum', {
  description: indexerDescription,
  metadata: {
    title: 'Fulcrum',
    icon: 'https://raw.githubusercontent.com/Start9Labs/fulcrum-startos/refs/heads/master/icon.png',
  },
  versionRange: '>=2.1.1:10',
  kind: 'running',
  healthChecks: ['primary'],
  enabled: async ({ effects }) => (await indexer(effects)) !== 'electrs',
})

const electrs = sdk.Dependency.optional('electrs', {
  description: indexerDescription,
  metadata: {
    title: 'Electrs',
    icon: 'https://raw.githubusercontent.com/Start9Labs/electrs-startos/refs/heads/master/icon.svg',
  },
  versionRange: '>=0.11.1:16',
  kind: 'running',
  healthChecks: ['electrs'],
  enabled: async ({ effects }) => (await indexer(effects)) === 'electrs',
})

export const dependencies = sdk.Dependencies.of()
  .addDependency(tor)
  .addDependency(bitcoind)
  .addDependency(bitcoindTestnet)
  .addDependency(fulcrum)
  .addDependency(electrs)
