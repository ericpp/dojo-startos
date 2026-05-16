import { sdk } from './sdk'
import { StoreJson } from './fileModels/store.json'
import { manifest as bitcoinManifest } from 'bitcoin-core-startos/startos/manifest'
import { manifest as bitcoindTestnetManifest } from 'bitcoind-testnet4-startos/startos/manifest'
import { btcMountpoint } from './utils'

export function getMounts({ config }: { config: StoreJson }) {

  let mounts = sdk.Mounts.of()
    .mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/root',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'db',
      subpath: null,
      mountpoint: '/var/lib/mysql',
      readonly: false,
    })

  if (config?.bitcoinNode?.type === 'bitcoind') {
    // TODO: Add testnet somehow?
    mounts = mounts.mountDependency<typeof bitcoinManifest>({
      dependencyId: 'bitcoind',
      volumeId: 'main',
      subpath: null,
      mountpoint: btcMountpoint,
      readonly: true,
    })
  }

  if (config?.bitcoinNode?.type === 'bitcoind-testnet') {
    mounts = mounts.mountDependency<typeof bitcoindTestnetManifest>({
      dependencyId: 'bitcoind-testnet',
      volumeId: 'main',
      subpath: 'testnet4',
      mountpoint: btcMountpoint,
      readonly: true,
    })
  }

  return mounts
}