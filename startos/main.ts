import { SubContainer, healthFns } from '@start9labs/start-sdk'
import { manifest as bitcoinManifest } from 'bitcoin-core-startos/startos/manifest'
import { manifest as bitcoinTestnetManifest } from 'bitcoind-testnet4-startos/startos/manifest'
import { socksHostId, socksPort } from 'tor-startos/startos/utils'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { manifest } from './manifest'
import { sdk } from './sdk'
import {
  assetsDir,
  bitcoinDir,
  bitcoinNodes,
  dataDir,
  dbDir,
  getBitcoinBridge,
  getIndexerBridge,
  splitAddress,
  uiHostId,
  uiInterfaceId,
  uiPort,
} from './utils'

/**
 * The health scripts report more than pass/fail, which `runHealthScript` cannot
 * express: 0 healthy, 60 not up yet, 62 broken and needing the user, anything
 * else up but not yet usable.
 */
const runCheckScript = async (
  sub: SubContainer<typeof manifest>,
  env: Record<string, string>,
  script: string,
  successMessage: string,
  loadingMessage: string,
): Promise<healthFns.HealthCheckResult> => {
  // The daemons' environment, not an empty one: the scripts source config.env
  // too, and without the S9_* values they authenticate with an empty admin key
  // and dial an empty Bitcoin RPC address.
  const res = await sub.exec(['bash', `${assetsDir}/${script}`], {
    env,
    timeout: 30_000,
  })
  const stderr = res.stderr?.toString().trim()
  if (res.exitCode === 0) return { result: 'success', message: successMessage }
  if (res.exitCode === 62)
    return { result: 'failure', message: stderr || loadingMessage }
  if (res.exitCode === 60)
    return { result: 'starting', message: stderr || loadingMessage }
  return { result: 'loading', message: stderr || loadingMessage }
}

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Dojo!'))

  const store = await storeJson.read().const(effects)
  if (!store) throw new Error('No store.json')
  if (!store.adminKey || !store.apiKey || !store.jwtSecret) {
    throw new Error('Dojo keys have not been generated yet')
  }

  const node = bitcoinNodes[store.bitcoinNode]
  const bitcoin = await getBitcoinBridge(effects, store.bitcoinNode)
  if (!bitcoin.rpc || !bitcoin.zmqBlock || !bitcoin.zmqTx) {
    throw new Error(
      'Bitcoin is not reachable yet — check that it is installed with ZeroMQ enabled',
    )
  }
  const indexer = await getIndexerBridge(effects, store.indexer)
  if (!indexer) throw new Error('The indexer is not reachable yet')

  const rpc = splitAddress(bitcoin.rpc)
  const electrum = splitAddress(indexer)
  const socks = splitAddress(
    await sdk.host
      .getBridgeAddress(effects, {
        packageId: 'tor',
        hostId: socksHostId,
        internalPort: socksPort,
        fallbackPort: socksPort,
      })
      .const(),
  )

  // The onion wallets pair to. Read straight off the interface rather than from
  // a copy in store.json, so adding or removing the address restarts main and
  // takes effect immediately instead of waiting for the next container init.
  const onion = await sdk.host
    .getOwn(
      effects,
      uiHostId,
      (host) =>
        Object.values(host?.bindings ?? {})
          .flatMap((binding) => Object.values(binding.interfaces))
          .find((iface) => iface.id === uiInterfaceId)
          ?.addressInfo.public.filter({ pluginId: 'tor' })
          .format('hostname-info')[0]?.hostname,
    )
    .const()

  const sub = sdk.SubContainer.of(
    effects,
    { imageId: 'dojo' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: dataDir,
        readonly: false,
      })
      .mountVolume({
        volumeId: 'db',
        subpath: null,
        mountpoint: dbDir,
        readonly: false,
      })
      .mountDependency<typeof bitcoinManifest | typeof bitcoinTestnetManifest>({
        dependencyId: store.bitcoinNode,
        volumeId: 'main',
        subpath: null,
        mountpoint: bitcoinDir,
        readonly: true,
      })
      // The entrypoint and health scripts, mounted rather than baked into the
      // image — editing one would otherwise mean rebuilding a Dockerfile that
      // compiles Tor and Soroban from source.
      .mountAssets({ subpath: null, mountpoint: assetsDir }),
    'dojo-sub',
  )

  // Consumed by config.env, which maps these onto the NODE_* /
  // BITCOIND_* / INDEXER_* names Dojo itself reads. The indirection is
  // load-bearing: config.env sources upstream's own .env for defaults, which
  // would overwrite anything set here under the upstream names.
  const env = {
    S9_DATA_DIR: dataDir,
    S9_TOR_ADDRESS: onion ?? '',
    S9_TOR_SOCKS_HOST: socks.host,
    S9_TOR_SOCKS_PORT: socks.port,
    S9_BITCOIN_NETWORK: node.network,
    S9_BITCOIN_RPC_HOST: rpc.host,
    S9_BITCOIN_RPC_PORT: rpc.port,
    S9_BITCOIN_ZMQ_BLOCK: bitcoin.zmqBlock,
    S9_BITCOIN_ZMQ_TX: bitcoin.zmqTx,
    S9_BITCOIN_COOKIE: `${bitcoinDir}/${node.cookieFile}`,
    S9_INDEXER_TYPE: store.indexer,
    S9_INDEXER_HOST: electrum.host,
    S9_INDEXER_PORT: electrum.port,
    S9_API_KEY: store.apiKey,
    S9_ADMIN_KEY: store.adminKey,
    S9_JWT_SECRET: store.jwtSecret,
    S9_PAYMENT_CODE: store.paymentCode ?? '',
    S9_SOROBAN_ANNOUNCE: store.sorobanAnnounce ? 'on' : 'off',
    S9_PANDOTX_PROCESS:
      store.sorobanAnnounce && store.pandotxProcess ? 'on' : 'off',
    S9_PANDOTX_PUSH: store.pandotxPush ? 'on' : 'off',
    S9_PANDOTX_FALLBACK: store.pandotxFallbackMode,
    S9_PANDOTX_RETRIES: String(store.pandotxRetries),
  }

  return sdk.Daemons.of(effects)
    .addHealthCheck('tor-address', {
      ready: {
        display: i18n('Tor Address'),
        // Not a transient failure the default trigger's 1 s failure cadence is
        // for: the address only changes on a main restart, and re-reporting it
        // every second floods the log while the user goes and adds one.
        trigger: sdk.trigger.cooldownTrigger(30_000),
        fn: () =>
          onion
            ? { result: 'success', message: i18n('Wallets can pair over Tor') }
            : {
                result: 'failure',
                message: i18n(
                  'Add a Tor address to a Dojo interface — wallets pair over the onion address, and Dojo cannot issue a pairing code without one',
                ),
              },
      },
      requires: [],
    })
    .addHealthCheck('bitcoin-client', {
      ready: {
        display: i18n('Bitcoin Client'),
        // An unsupported client stays unsupported until the user changes it,
        // and each poll is an RPC round trip — the default trigger's 1 s
        // failure cadence would hammer Bitcoin's RPC forever.
        trigger: sdk.trigger.statusTrigger(30_000, { starting: 5_000 }),
        fn: () =>
          runCheckScript(
            sub,
            env,
            'check-bitcoin-client.sh',
            i18n('Bitcoin is a client Dojo supports'),
            i18n('Waiting for Bitcoin...'),
          ),
      },
      requires: [],
    })
    .addDaemon('mariadb', {
      subcontainer: sub,
      exec: { command: ['bash', `${assetsDir}/db-entrypoint.sh`], env },
      ready: {
        display: i18n('Database'),
        gracePeriod: 120_000,
        fn: () =>
          runCheckScript(
            sub,
            env,
            'check-mysql.sh',
            i18n('The database is accepting connections'),
            i18n('The database is starting...'),
          ),
      },
      requires: [],
    })
    .addDaemon('soroban', {
      subcontainer: sub,
      exec: { command: ['bash', `${assetsDir}/soroban-entrypoint.sh`], env },
      ready: {
        display: i18n('Soroban'),
        fn: () =>
          runCheckScript(
            sub,
            env,
            'check-soroban.sh',
            i18n('Soroban is running'),
            i18n('Soroban is starting...'),
          ),
      },
      requires: [],
    })
    .addDaemon('backend', {
      subcontainer: sub,
      exec: { command: ['bash', `${assetsDir}/backend-entrypoint.sh`], env },
      ready: {
        display: i18n('Dojo API'),
        gracePeriod: 120_000,
        fn: () =>
          runCheckScript(
            sub,
            env,
            'check-api.sh',
            i18n('The Dojo API is accepting connections'),
            i18n('The Dojo API is starting...'),
          ),
      },
      requires: ['tor-address', 'bitcoin-client', 'mariadb', 'soroban'],
    })
    .addDaemon('frontend', {
      subcontainer: sub,
      exec: { command: ['bash', `${assetsDir}/frontend-entrypoint.sh`], env },
      ready: {
        display: i18n('Web Server'),
        gracePeriod: 120_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web server is ready'),
            errorMessage: i18n('The web server is not ready'),
          }),
      },
      requires: ['backend'],
    })
    .addHealthCheck('pushtx', {
      ready: {
        display: i18n('Transaction Broadcast'),
        fn: () =>
          runCheckScript(
            sub,
            env,
            'check-pushtx.sh',
            i18n('Dojo can broadcast transactions'),
            i18n('The broadcast endpoint is starting...'),
          ),
      },
      requires: ['backend'],
    })
    .addHealthCheck('synced', {
      ready: {
        display: i18n('Sync Progress'),
        gracePeriod: 720_000,
        fn: () =>
          runCheckScript(
            sub,
            env,
            'check-synced.sh',
            i18n('Dojo is caught up with the chain'),
            i18n('Dojo is syncing...'),
          ),
      },
      requires: ['backend'],
    })
})
