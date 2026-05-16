import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

const uiInterfaceId = 'ui'

export const watchHosts = sdk.setupOnInit(async (effects, _) => {
  const proxy = await sdk.getContainerIp(effects, {
    packageId: 'tor'
  }).const()

  const publicInfo = await sdk.serviceInterface
    .getOwn(effects, uiInterfaceId, (i) =>
      i?.addressInfo?.public.filter({
        exclude: { kind: 'domain' },
      }),
    )
    .const()
console.log('publicInfo', publicInfo)
  if (!publicInfo) return

  const announceAddrs = publicInfo
    .filter({
      predicate: ({ metadata }) =>
        metadata.kind === 'plugin' && metadata.packageId === 'tor',
    })
    .format()

  await storeJson.merge(
    effects,
    {
      tor: {
        proxy,
        announceAddrs,
      },
    },
    { allowWriteAfterConst: true },
  )
})