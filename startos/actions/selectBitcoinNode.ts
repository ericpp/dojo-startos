import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
const { InputSpec, Value } = sdk

const bitcoinNodeInputSpec = InputSpec.of({
  bitcoinNodeType: Value.select({
    name: i18n('Select Bitcoin Node'),
    description: i18n('The Bitcoin node type you would like to use for Dojo'),
    values: {
      bitcoind: i18n('Bitcoin Core'),
      'bitcoind-testnet': i18n('Bitcoin Core (testnet4)'),
    },
    default: 'bitcoind',
  }),
})

export const selectBitcoinNodeAction = sdk.Action.withInput(
  'select-bitcoin-node',

  {
    name: i18n('Select Bitcoin Node'),
    description: i18n(
      'The Bitcoin node type you would like to use for Dojo',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  },

  // form input specification
  bitcoinNodeInputSpec,

  // pre-fill the form
  async ({ effects }) => {
    const bitcoinNodeType = await storeJson.read((s) => s.bitcoinNode.type).const(effects)
    return { bitcoinNodeType: bitcoinNodeType || 'bitcoind' }
  },

  // execution function
  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      bitcoinNode: {
        type: input.bitcoinNodeType,
      },
    })
  },
)