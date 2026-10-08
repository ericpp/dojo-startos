import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const selectBitcoinNodeAction = sdk.Action.withInput(
  'select-bitcoin-node',

  async () => ({
    name: i18n('Select Bitcoin Node'),
    description: i18n('Choose which Bitcoin node Dojo tracks'),
    warning: i18n(
      'Switching networks leaves Dojo tracking a chain its database was not built for. Only change this on a fresh Dojo.',
    ),
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  InputSpec.of({
    bitcoinNode: Value.select({
      name: i18n('Bitcoin Node'),
      description: i18n(
        'The network Dojo tracks.\n- Bitcoin: mainnet, from the Bitcoin service.\n- Bitcoin (testnet4): testnet4, from the Bitcoin (testnet4) service.',
      ),
      values: {
        bitcoind: i18n('Bitcoin'),
        'bitcoind-testnet': i18n('Bitcoin (testnet4)'),
      },
      default: 'bitcoind',
    }),
  }),

  async ({ effects }) =>
    storeJson.read((s) => ({ bitcoinNode: s.bitcoinNode })).const(effects),

  async ({ effects, input }) => storeJson.merge(effects, input),
)
