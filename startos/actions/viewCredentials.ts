import { backendJson } from '../fileModels/backend.json'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const viewCredentialsAction = sdk.Action.withoutInput(
  'view-credentials',

  async () => ({
    name: i18n('View Pairing Code'),
    description: i18n(
      'Show the pairing code your wallet scans, and the key that signs in to the maintenance tool',
    ),
    warning: null,
    // The pairing code is assembled by the backend at startup, so it only
    // exists once Dojo has run.
    allowedStatuses: 'only-running',
    group: i18n('Credentials'),
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const backend = await backendJson.read().const(effects)
    const adminKey = await storeJson.read((s) => s.adminKey).const(effects)

    return {
      version: '1',
      title: i18n('Pairing Code'),
      message: i18n(
        'Scan the pairing code from your wallet. Use the admin key to sign in to the Dojo Maintenance Tool.',
      ),
      result: {
        type: 'group',
        value: [
          {
            name: i18n('Pairing Code'),
            description: i18n('Pairs a wallet with this Dojo'),
            type: 'single',
            value: backend?.pairingCode ?? '',
            masked: true,
            copyable: true,
            qr: true,
            launchable: false,
          },
          {
            name: i18n('Admin Key'),
            description: i18n('Signs in to the Dojo Maintenance Tool'),
            type: 'single',
            value: adminKey ?? '',
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
