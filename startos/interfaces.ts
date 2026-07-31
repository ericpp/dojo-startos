import { i18n } from './i18n'
import { sdk } from './sdk'
import { apiInterfaceId, uiHostId, uiInterfaceId, uiPort } from './utils'

// nginx fronts both on one port: the maintenance tool under /admin, and the
// wallet-facing API under /v2. They are separate interfaces because they are
// for different audiences — a person opens one in a browser, a wallet pairs to
// the other — and because /v2 is the URL the pairing code actually carries.
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, uiHostId)
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, { protocol: 'http' })

  const ui = sdk.createInterface(effects, {
    name: i18n('Maintenance Tool'),
    id: uiInterfaceId,
    description: i18n("Dojo's admin interface, for managing your Dojo"),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '/admin/',
    query: {},
  })

  const api = sdk.createInterface(effects, {
    name: i18n('Wallet API'),
    id: apiInterfaceId,
    description: i18n('The endpoint wallets pair to and query'),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '/v2/',
    query: {},
  })

  return [await uiMultiOrigin.export([ui, api])]
})
