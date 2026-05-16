import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { i18n } from '../i18n'

const { InputSpec, Value, Variants } = sdk

const sorobanVariants = Variants.of({
  disabled: {
    name: i18n('Disabled'),
    spec: InputSpec.of({}),
  },
  enabled: {
    name: i18n('Enabled'),
    spec: InputSpec.of({
      'pandotx-process': Value.toggle({
        name: i18n('PandoTx Process'),
        description: i18n(
          'Process and relay transactions from other Soroban nodes',
        ),
        default: false,
      }),
    }),
  },
})

export const inputSpec = InputSpec.of({
  paymentCode: Value.text({
    name: i18n('BIP47 Payment Code'),
    required: false,
    default: null,
    placeholder: null,
    inputmode: 'text',
    patterns: [],
    masked: false,
  }),
  adminKey: Value.text({
    name: i18n('Admin Key'),
    description: i18n('Key for accessing the admin/maintenance'),
    required: true,
    default: { charset: 'a-z,A-Z,0-9', len: 22 },
    placeholder: null,
    inputmode: 'text',
    patterns: [],
    masked: true,
    generate: { charset: 'a-z,A-Z,0-9', len: 22 },
  }),
  apiKey: Value.text({
    name: i18n('API Key'),
    description: i18n('Key for accessing the services'),
    required: true,
    default: { charset: 'a-z,A-Z,0-9', len: 22 },
    placeholder: null,
    inputmode: 'text',
    patterns: [],
    masked: true,
    generate: { charset: 'a-z,A-Z,0-9', len: 22 },
  }),
  jwtSecret: Value.text({
    name: i18n('JWT Secret'),
    description: i18n('Secret used by the server for signing'),
    required: true,
    default: { charset: 'a-z,A-Z,0-9', len: 22 },
    placeholder: null,
    inputmode: 'text',
    patterns: [],
    masked: true,
    generate: { charset: 'a-z,A-Z,0-9', len: 22 },
  }),
  sorobanAnnounce: Value.union({
    name: i18n('Soroban Network Announce'),
    description: i18n('Configure Soroban network participation'),
    warning: null,
    variants: sorobanVariants,
    default: 'disabled',
  }),
  pandotxPush: Value.toggle({
    name: i18n('PandoTx Push'),
    description: i18n(
      'Push your transactions through random Soroban nodes for enhanced privacy',
    ),
    default: true,
  }),
  pandotxRetries: Value.number({
    name: i18n('PandoTx Retries'),
    description: i18n('Maximum retry attempts for failed transaction pushes'),
    required: true,
    default: 2,
    min: 0,
    max: 10,
    integer: true,
    units: null,
    placeholder: null,
  }),
  pandotxFallbackMode: Value.select({
    name: i18n('PandoTx Fallback Mode'),
    description: i18n('Behavior when Soroban push fails'),
    values: {
      convenient: i18n('Convenient (fallback to local node)'),
      secure: i18n('Secure (fail if Soroban unavailable)'),
    },
    default: 'convenient',
  }),
})

export const configureDojoAction = sdk.Action.withInput(
  'configure-dojo',

  async ({ effects }) => ({
    name: i18n('Configure Dojo'),
    description: i18n(
      'Customize your Dojo',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  inputSpec,

  // pre-fill
  async ({ effects }) => {
    const dojo = await storeJson.read((s) => s.dojo).const(effects)
    if (!dojo) return {}
    return {
      ...dojo,
      sorobanAnnounce:
        dojo.sorobanAnnounce.enabled === 'enabled'
          ? { selection: 'enabled', value: { 'pandotx-process': dojo.sorobanAnnounce.pandotxProcess } }
          : { selection: 'disabled', value: {} },
    }
  },

  // execution
  async ({ effects, input }) => {
    const announce = input.sorobanAnnounce
    return storeJson.merge(effects, {
      dojo: {
        ...input,
        sorobanAnnounce: {
          enabled: announce.selection,
          pandotxProcess:
            announce.selection === 'enabled'
              ? announce.value['pandotx-process']
              : false,
        },
      },
    })
  },
)
