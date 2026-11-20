import { T } from '@start9labs/start-sdk'
import { randomInt } from 'crypto'
import {
  rpcHostId as coreRpcHostId,
  rpcPort as coreRpcPort,
  rpcCookieName as coreCookieFile,
  rpcVolumeId as coreRpcVolumeId,
  zmqHostId as coreZmqHostId,
  zmqPortBlock as coreZmqPortBlock,
  zmqPortTransaction as coreZmqPortTransaction,
} from 'bitcoin-core-startos/startos/utils'
import {
  rpcHostId as testnetRpcHostId,
  rpcPort as testnetRpcPort,
  rpccookiefile as testnetCookieFile,
  zmqHostId as testnetZmqHostId,
  zmqPortBlock as testnetZmqPortBlock,
  zmqPortTransaction as testnetZmqPortTransaction,
} from 'bitcoind-testnet4-startos/startos/utils'
import {
  electrumHostId as electrsHostId,
  port as electrsPort,
} from 'electrs-startos/startos/utils'
import {
  electrumPort as fulcrumPort,
  mainHostId as fulcrumHostId,
} from 'fulcrum-startos/startos/utils'
import { sdk } from './sdk'

/** nginx — the only port reachable from outside the container. */
export const uiPort = 9000

/** Kept as 'main' from the pre-2.0 package: the host carries the user's onion
 * address, and renaming it would orphan that address and break paired wallets. */
export const uiHostId = 'main'
export const uiInterfaceId = 'ui'
export const apiInterfaceId = 'api'

export const dataDir = '/data'
export const dbDir = '/var/lib/mysql'
export const bitcoinDir = '/mnt/bitcoin'
/** Where the packaged entrypoint and health scripts are mounted, read-only. */
export const assetsDir = '/assets'

/** MariaDB's database and account; the account's password is per install, in store.json. */
export const mysqlDatabase = 'samourai-main'
export const mysqlUser = 'samourai'

/**
 * Each supported Bitcoin flavor's bindings, imported from that package rather
 * than hardcoded — mainnet and testnet4 differ on every port and on which
 * volume holds the RPC cookie. Keyed by package id, which is also the
 * dependency id in dependencies.ts.
 */
export const bitcoinNodes = {
  bitcoind: {
    network: 'mainnet',
    rpc: { hostId: coreRpcHostId, internalPort: coreRpcPort },
    zmqBlock: { hostId: coreZmqHostId, internalPort: coreZmqPortBlock },
    zmqTx: { hostId: coreZmqHostId, internalPort: coreZmqPortTransaction },
    cookieVolume: coreRpcVolumeId,
    cookieFile: coreCookieFile,
  },
  'bitcoind-testnet': {
    network: 'testnet',
    rpc: { hostId: testnetRpcHostId, internalPort: testnetRpcPort },
    zmqBlock: { hostId: testnetZmqHostId, internalPort: testnetZmqPortBlock },
    zmqTx: {
      hostId: testnetZmqHostId,
      internalPort: testnetZmqPortTransaction,
    },
    // main until remcoros/bitcoind-testnet4-startos#12's public volume is released
    cookieVolume: 'main',
    cookieFile: testnetCookieFile,
  },
} as const

export type BitcoinNode = keyof typeof bitcoinNodes

/** Each supported indexer's host id and internal (plaintext) Electrum port. */
export const indexers = {
  fulcrum: { hostId: fulcrumHostId, internalPort: fulcrumPort },
  electrs: { hostId: electrsHostId, internalPort: electrsPort },
} as const

export type Indexer = keyof typeof indexers

/**
 * The selected Bitcoin node's RPC and ZMQ endpoints over the LXC bridge,
 * replacing the deprecated `<pkg>.startos` DNS name and hardcoded ports. Three
 * reactive `.const()` watches, one per address, so main restarts only when an
 * address it actually passes to Dojo changes — a Bitcoin update is zero
 * restarts, install / uninstall / port change is one healing restart. Each
 * resolves null while the node is absent or ZMQ is off; main throws until all
 * three exist and the `.const()` heals when they appear.
 */
export const getBitcoinBridge = async (
  effects: T.Effects,
  node: BitcoinNode,
) => {
  const binding = bitcoinNodes[node]
  const rpc = await sdk.host
    .getBridgeAddress(effects, { packageId: node, ...binding.rpc, ssl: false })
    .const()
  const zmqBlock = await sdk.host
    .getBridgeAddress(effects, { packageId: node, ...binding.zmqBlock })
    .const()
  const zmqTx = await sdk.host
    .getBridgeAddress(effects, { packageId: node, ...binding.zmqTx })
    .const()
  return { rpc, zmqBlock, zmqTx }
}

/**
 * The selected indexer's plaintext Electrum endpoint over the bridge. Both
 * indexers bind Electrum as `secure: null` with `addSsl`, publishing a
 * plaintext and a TLS address; Dojo speaks plain TCP, so pin the plaintext one.
 */
export const getIndexerBridge = (effects: T.Effects, indexer: Indexer) =>
  sdk.host
    .getBridgeAddress(effects, {
      packageId: indexer,
      ...indexers[indexer],
      ssl: false,
    })
    .const()

/** Split a `host:port` bridge address into the two env vars Dojo wants. */
export const splitAddress = (address: string) => {
  const separator = address.lastIndexOf(':')
  return {
    host: address.slice(0, separator),
    port: address.slice(separator + 1),
  }
}

const ALPHANUM =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Uniform over the charset — `randomInt` rejection-samples, `byte % 62` does not. */
export const generateKey = (len: number) =>
  Array.from({ length: len }, () => ALPHANUM[randomInt(ALPHANUM.length)]).join(
    '',
  )
