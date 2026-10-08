import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value, Variants } = sdk

const secret = { charset: 'a-z,A-Z,0-9', len: 22 }

export const configureDojoAction = sdk.Action.withInput(
  'configure-dojo',

  async () => ({
    name: i18n('Configure Dojo'),
    description: i18n(
      'Set the keys wallets authenticate with, and how Dojo broadcasts transactions',
    ),
    warning: i18n(
      'Changing a key invalidates the pairing code, and every paired wallet has to be paired again.',
    ),
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  InputSpec.of({
    paymentCode: Value.text({
      name: i18n('BIP47 Payment Code'),
      description: i18n(
        'A PayNym payment code that can sign in to the maintenance tool in place of the admin key',
      ),
      required: false,
      default: null,
      placeholder: null,
      inputmode: 'text',
      patterns: [],
      masked: false,
    }),
    apiKey: Value.text({
      name: i18n('API Key'),
      description: i18n('The key wallets authenticate to Dojo with'),
      required: true,
      default: secret,
      placeholder: null,
      inputmode: 'text',
      patterns: [],
      masked: true,
      generate: secret,
    }),
    adminKey: Value.text({
      name: i18n('Admin Key'),
      description: i18n('The key that signs in to the maintenance tool'),
      required: true,
      default: secret,
      placeholder: null,
      inputmode: 'text',
      patterns: [],
      masked: true,
      generate: secret,
    }),
    jwtSecret: Value.text({
      name: i18n('JWT Secret'),
      description: i18n('The secret Dojo signs its session tokens with'),
      required: true,
      default: secret,
      placeholder: null,
      inputmode: 'text',
      patterns: [],
      masked: true,
      generate: secret,
    }),
    soroban: Value.union({
      name: i18n('Soroban Network'),
      description: i18n(
        "Whether other Soroban users can reach the Soroban network through this Dojo.\n- Do not announce: only this Dojo uses its Soroban node.\n- Announce: the node's address is published, so other users can interact with the Soroban network through it.",
      ),
      warning: null,
      variants: Variants.of({
        off: { name: i18n('Do not announce'), spec: InputSpec.of({}) },
        on: {
          name: i18n('Announce'),
          spec: InputSpec.of({
            pandotxProcess: Value.toggle({
              name: i18n('Relay Transactions'),
              description: i18n(
                'Broadcast transactions that other Soroban nodes hand to this one',
              ),
              default: false,
            }),
          }),
        },
      }),
      default: 'off',
    }),
    pandotxPush: Value.toggle({
      name: i18n('Broadcast Through Soroban'),
      description: i18n(
        'Send your own transactions through a randomly chosen Soroban node, so they are not first seen at your node',
      ),
      default: true,
    }),
    pandotxFallbackMode: Value.select({
      name: i18n('If Soroban Broadcast Fails'),
      description: i18n(
        'What happens to a transaction no Soroban node accepts.\n- Broadcast from this node instead: the transaction is still broadcast, from your own node.\n- Do not broadcast: your own node does not broadcast it either, and the wallet is not told it failed.',
      ),
      values: {
        convenient: i18n('Broadcast from this node instead'),
        secure: i18n('Do not broadcast'),
      },
      default: 'convenient',
    }),
    pandotxRetries: Value.number({
      name: i18n('Soroban Broadcast Retries'),
      description: i18n(
        'How many other Soroban nodes to try before falling back',
      ),
      required: true,
      default: 2,
      min: 0,
      max: 10,
      integer: true,
      units: null,
      placeholder: null,
    }),
  }),

  async ({ effects }) => {
    const store = await storeJson.read().const(effects)
    if (!store) return {}
    return {
      paymentCode: store.paymentCode,
      apiKey: store.apiKey,
      adminKey: store.adminKey,
      jwtSecret: store.jwtSecret,
      soroban: store.sorobanAnnounce
        ? {
            selection: 'on' as const,
            value: { pandotxProcess: store.pandotxProcess },
          }
        : { selection: 'off' as const, value: {} },
      pandotxPush: store.pandotxPush,
      pandotxFallbackMode: store.pandotxFallbackMode,
      pandotxRetries: store.pandotxRetries,
    }
  },

  async ({ effects, input }) => {
    const { soroban, ...rest } = input
    await storeJson.merge(effects, {
      ...rest,
      sorobanAnnounce: soroban.selection === 'on',
      pandotxProcess:
        soroban.selection === 'on' ? soroban.value.pandotxProcess : false,
    })
  },
)
