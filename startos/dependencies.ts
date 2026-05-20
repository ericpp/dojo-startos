import { T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { configureDojoAction } from './actions/configureDojo'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const config = await storeJson.read((s) => s).const(effects)
  const deps: T.CurrentDependenciesResult<any> = {}

  if (config?.bitcoinNode?.type === 'bitcoind') {
    deps['bitcoind'] = {
      kind: 'running',
      versionRange: '>=0.21.1.2',
      healthChecks: ['bitcoind'],
    }
  }

  if (config?.bitcoinNode?.type === 'bitcoind-testnet') {
    deps['bitcoind-testnet'] = {
      kind: 'running',
      versionRange: '>=0.21.1.2',
      healthChecks: ['bitcoind'],
    }
  }

  if (config?.indexer?.type === 'fulcrum') {
    deps['fulcrum'] = {
      kind: 'exists',
      versionRange: '>=2.0.0',
    }
  }

  if (config?.indexer?.type === 'electrs') {
    deps['electrs'] = {
      kind: 'exists',
      versionRange: '>=0.10.7',
    }
  }

  deps['tor'] = {
    kind: 'running',
    versionRange: '>=0.4.9.5:0',
    healthChecks: [],
  }

  return deps
})
