import { T, SubContainer, Daemons, healthFns } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { i18n } from './i18n'
import { sorobanPort, backendPort, uiPort } from './utils'
import { manifest } from './manifest'
import { StoreJson } from './fileModels/store.json'

type HealthCheckResult = healthFns.HealthCheckResult

async function runCheckScript(
  sub: SubContainer<typeof manifest>,
  script: string,
  successMessage: string,
  defaultLoadingMessage: string,
): Promise<HealthCheckResult> {
  try {
    const res = await sub.exec([script], {}, 30_000)
    if (res.exitCode === 0) {
      return { result: 'success', message: successMessage }
    }
    const stderrMsg = res.stderr?.toString().trim()
    if (res.exitCode === 60) {
      return { result: 'starting', message: stderrMsg || null }
    }
    return { result: 'loading', message: stderrMsg || defaultLoadingMessage }
  } catch {
    return { result: 'failure', message: defaultLoadingMessage }
  }
}

export async function getDaemons({ effects, config, sub }: {
  effects: T.Effects,
  config: StoreJson,
  sub: SubContainer<typeof manifest>,
}) {
  const hasTorAddress = config.tor.announceAddrs?.some((ip: string) => ip?.includes('.onion'))

  return sdk.Daemons.of(effects)
    .addDaemon('mariadb', {
      subcontainer: sub,
      exec: {
        command: ['db-entrypoint.sh'],
        env: {},
      },
      ready: {
        display: i18n('MySQL'),
        fn: () =>
          runCheckScript(
            sub,
            'check-mysql.sh',
            i18n('MySQL is online and ready for connections'),
            i18n('MySQL is starting...'),
          ),
      },
      requires: [],
    })
    .addDaemon('soroban', {
      subcontainer: sub,
      exec: {
        command: ['soroban-entrypoint.sh'],
        env: {},
      },
      ready: {
        display: i18n('Soroban'),
        fn: () =>
          runCheckScript(
            sub,
            'check-soroban.sh',
            i18n('Soroban is running'),
            i18n('Soroban is starting...'),
          ),
      },
      requires: [],
    })
    .addDaemon('backend', {
      subcontainer: sub,
      exec: {
        command: ['backend-entrypoint.sh'],
        env: {},
      },
      ready: {
        display: i18n('Dojo API'),
        fn: () =>
          runCheckScript(
            sub,
            'check-api.sh',
            i18n('Dojo API is online and ready for connections'),
            i18n('Dojo API is starting...'),
          ),
      },
      requires: ['mariadb', 'soroban'],
    })
    .addDaemon('frontend', {
      subcontainer: sub,
      exec: {
        command: ['nginx'],
        env: {},
      },
      ready: {
        gracePeriod: 120_000,
        display: i18n('Dojo Web UI'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('Dojo Web UI is ready'),
            errorMessage: i18n('Dojo Web UI is not ready'),
          }),
      },
      requires: ['backend'],
    })
    .addHealthCheck('pushtx', {
      ready: {
        display: i18n('PushTx'),
        fn: () =>
          runCheckScript(
            sub,
            'check-pushtx.sh',
            i18n('Dojo PushTx API is online and ready for connections'),
            i18n('PushTx is starting...'),
          ),
      },
      requires: ['backend'],
    })
    .addHealthCheck('synced', {
      ready: {
        display: i18n('Synced'),
        gracePeriod: 720_000,
        fn: () =>
          runCheckScript(
            sub,
            'check-synced.sh',
            i18n('Dojo is synced with the network'),
            i18n('Dojo is syncing...'),
          ),
      },
      requires: ['backend'],
    })
    .addHealthCheck('tor', {
      ready: {
        display: i18n('Tor'),
        fn: () =>
          hasTorAddress ? {
            result: 'success',
            message: i18n('Web UI interface has Tor address configured'),
          } : {
            result: 'failure',
            message: i18n('Web UI interface requires a Tor address to be configured'),
          }
      },
      requires: [],
    })
}