import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
const { InputSpec, Value } = sdk

const indexerInputSpec = InputSpec.of({
  indexerType: Value.select({
    name: i18n('Select Indexer'),
    description: i18n('The indexer you want to use for Dojo'),
    values: {
      fulcrum: i18n('Fulcrum'),
      electrs: i18n('electrs'),
    },
    default: 'fulcrum',
  }),
})

export const selectIndexerAction = sdk.Action.withInput(
  'select-indexer',

  {
    name: i18n('Select Indexer'),
    description: i18n(
      'The indexer you want to use for Dojo',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  },

  // form input specification
  indexerInputSpec,

  // pre-fill the form
  async ({ effects }) => {
    const indexerType = await storeJson.read((s) => s.indexer.type).const(effects)
    return { indexerType: indexerType || 'fulcrum' }
  },

  // execution function
  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      indexer: {
        type: input.indexerType,
      },
    })
  },
)