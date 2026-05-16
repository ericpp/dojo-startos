import { storeJson } from '../fileModels/store.json'
import { statsJson } from '../fileModels/stats.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
const { InputSpec, Value } = sdk

export const viewPairingCodeAction = sdk.Action.withoutInput(
  // ID
  "view-pairing-code",

  // Metadata
  async ({ effects }) => ({
    name: i18n("View Pairing Code"),
    description: i18n("View the pairing code for Dojo"),
    warning: null,
    allowedStatuses: "any", // 'any', 'only-running', 'only-stopped'
    group: i18n('Properties'),
    visibility: "enabled", // 'enabled', 'disabled', 'hidden'
  }),

  // Handler
  async ({ effects }) => {
    const stats = await statsJson.read((s) => s).const(effects);

    return {
      version: "1",
      title: "Pairing Code",
      message: "Your pairing code:",
      result: {
        type: 'single',
        name: i18n('Pairing Code'),
        description: i18n('Code for pairing your wallet with this Dojo'),
        value: stats?.pairingCode ?? '',
        masked: true,
        copyable: true,
        qr: true,
      }
    };
  },
);
