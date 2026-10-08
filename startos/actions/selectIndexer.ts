import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const selectIndexerAction = sdk.Action.withInput(
  'select-indexer',

  async () => ({
    name: i18n('Select Indexer'),
    description: i18n('Choose which indexer Dojo looks addresses up in'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  InputSpec.of({
    indexer: Value.select({
      name: i18n('Indexer'),
      description: i18n(
        'Where Dojo looks up address history. The indexer you pick must be installed.\n- Fulcrum: reads from the Fulcrum service.\n- Electrs: reads from the Electrs service.',
      ),
      values: {
        fulcrum: i18n('Fulcrum'),
        electrs: i18n('Electrs'),
      },
      default: 'fulcrum',
    }),
  }),

  async ({ effects }) =>
    storeJson.read((s) => ({ indexer: s.indexer })).const(effects),

  async ({ effects, input }) => storeJson.merge(effects, input),
)
