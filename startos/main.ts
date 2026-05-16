import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'

import { getMounts } from './mounts'
import { getDaemons } from './daemons'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Dojo!'))

  let config = await storeJson.read((s) => s).const(effects)
  if (!config) {
    throw new Error('store.json not found')
  }

  const sub = await sdk.SubContainer.of(
    effects,
    { imageId: 'dojo' },
    getMounts({ config }),
    'dojo-sub',
  )

  return await getDaemons({ effects, config, sub })
})
