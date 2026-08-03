import { FileHelper, IMPOSSIBLE, VersionInfo, z } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

/** Dojo's StartOS 0.3.5.1 config file. */
const legacyYaml = FileHelper.yaml(
  { base: sdk.volumes.main, subpath: 'start9/config.yaml' },
  z
    .object({
      'bitcoin-node': z
        .object({ type: z.enum(['bitcoind', 'bitcoind-testnet']) })
        .optional(),
      indexer: z.object({ type: z.enum(['fulcrum', 'electrs']) }).optional(),
      'payment-code': z.string().nullable().optional(),
      'admin-key': z.string().optional(),
      'api-key': z.string().optional(),
      'jwt-secret': z.string().optional(),
      'soroban-announce': z
        .object({
          enabled: z.enum(['disabled', 'enabled']).optional(),
          'pandotx-process': z.boolean().optional(),
        })
        .optional(),
      'pandotx-push': z.boolean().optional(),
      'pandotx-retries': z.number().optional(),
      'pandotx-fallback-mode': z.enum(['convenient', 'secure']).optional(),
    })
    .strip(),
)

/** The nested store.json shape used up to 1.29.2:1. */
const legacyStore = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  z
    .object({
      bitcoinNode: z
        .object({ type: z.enum(['bitcoind', 'bitcoind-testnet']) })
        .optional(),
      indexer: z.object({ type: z.enum(['fulcrum', 'electrs']) }).optional(),
      dojo: z
        .object({
          paymentCode: z.string().nullable().optional(),
          adminKey: z.string().optional(),
          apiKey: z.string().optional(),
          jwtSecret: z.string().optional(),
          sorobanAnnounce: z
            .object({
              enabled: z.enum(['disabled', 'enabled']).optional(),
              pandotxProcess: z.boolean().optional(),
            })
            .optional(),
          pandotxPush: z.boolean().optional(),
          pandotxRetries: z.number().optional(),
          pandotxFallbackMode: z.enum(['convenient', 'secure']).optional(),
        })
        .optional(),
    })
    .strip(),
)

export const current = VersionInfo.of({
  version: '1.29.2:3',
  releaseNotes: {
    en_US: `Requires an up-to-date Bitcoin.

Dojo needs pruning disabled and the transaction index and ZeroMQ enabled on Bitcoin, and asks for that through settings older Bitcoin releases do not have. The version Dojo required did not rule those out, so on an out-of-date Bitcoin the Auto-Configure task opened a form that could not be submitted, and came back no matter what you did. Dojo now requires the current revision of whichever Bitcoin version line you are on, so an out-of-date Bitcoin is reported as needing an update instead.`,
    es_ES: `Exige un Bitcoin actualizado.

Dojo necesita que la poda esté desactivada y el índice de transacciones y ZeroMQ activados en Bitcoin, y lo solicita mediante ajustes que las versiones antiguas de Bitcoin no tienen. La versión que Dojo exigía no las descartaba, así que en un Bitcoin desactualizado la tarea Auto-Configurar abría un formulario que no se podía enviar y volvía a aparecer hiciera lo que hiciera. Ahora Dojo exige la revisión actual de la línea de versiones de Bitcoin que uses, de modo que un Bitcoin desactualizado se señala como pendiente de actualizar.`,
    de_DE: `Setzt ein aktuelles Bitcoin voraus.

Dojo benötigt Bitcoin ohne Pruning und mit aktiviertem Transaktionsindex und ZeroMQ und fordert das über Einstellungen an, die ältere Bitcoin-Ausgaben nicht haben. Die von Dojo geforderte Version schloss diese nicht aus, sodass auf einem veralteten Bitcoin die Aufgabe „Auto-Konfiguration“ ein Formular öffnete, das sich nicht absenden ließ, und immer wieder zurückkam. Dojo verlangt jetzt die aktuelle Revision der von dir genutzten Bitcoin-Versionsreihe, sodass ein veraltetes Bitcoin stattdessen als aktualisierungsbedürftig gemeldet wird.`,
    pl_PL: `Wymaga aktualnego Bitcoina.

Dojo wymaga wyłączonego przycinania oraz włączonego indeksu transakcji i ZeroMQ w Bitcoinie i prosi o to poprzez ustawienia, których starsze wydania Bitcoina nie mają. Wersja wymagana przez Dojo ich nie wykluczała, więc na nieaktualnym Bitcoinie zadanie Auto-Konfiguracja otwierało formularz, którego nie dało się wysłać, i wracało niezależnie od podjętych działań. Dojo wymaga teraz bieżącej rewizji tej linii wydań Bitcoina, z której korzystasz, więc nieaktualny Bitcoin jest zgłaszany jako wymagający aktualizacji.`,
    fr_FR: `Exige un Bitcoin à jour.

Dojo a besoin que l'élagage soit désactivé et que l'index des transactions et ZeroMQ soient activés sur Bitcoin, et le demande via des réglages que les anciennes versions de Bitcoin n'ont pas. La version exigée par Dojo ne les excluait pas : sur un Bitcoin obsolète, la tâche Auto-Configuration ouvrait un formulaire impossible à envoyer et revenait quoi que vous fassiez. Dojo exige désormais la révision actuelle de la ligne de versions de Bitcoin que vous utilisez, de sorte qu'un Bitcoin obsolète est signalé comme devant être mis à jour.`,
  },
  migrations: {
    up: async ({ effects }) => {
      const yaml = await legacyYaml.read().once()
      if (yaml) {
        await storeJson.merge(effects, {
          bitcoinNode: yaml['bitcoin-node']?.type,
          indexer: yaml.indexer?.type,
          paymentCode: yaml['payment-code'],
          adminKey: yaml['admin-key'],
          apiKey: yaml['api-key'],
          jwtSecret: yaml['jwt-secret'],
          sorobanAnnounce: yaml['soroban-announce']?.enabled === 'enabled',
          pandotxProcess: yaml['soroban-announce']?.['pandotx-process'],
          pandotxPush: yaml['pandotx-push'],
          pandotxRetries: yaml['pandotx-retries'],
          pandotxFallbackMode: yaml['pandotx-fallback-mode'],
        })
        return
      }

      // 1.29.2:1 and below nested most of the config under `dojo`; flatten it
      // so the keys survive — losing adminKey/apiKey here would silently mint
      // new ones and break every already-paired wallet.
      const store = await legacyStore.read().once()
      if (!store?.dojo) return
      await storeJson.merge(effects, {
        bitcoinNode: store.bitcoinNode?.type,
        indexer: store.indexer?.type,
        paymentCode: store.dojo.paymentCode,
        adminKey: store.dojo.adminKey,
        apiKey: store.dojo.apiKey,
        jwtSecret: store.dojo.jwtSecret,
        sorobanAnnounce: store.dojo.sorobanAnnounce?.enabled === 'enabled',
        pandotxProcess: store.dojo.sorobanAnnounce?.pandotxProcess,
        pandotxPush: store.dojo.pandotxPush,
        pandotxRetries: store.dojo.pandotxRetries,
        pandotxFallbackMode: store.dojo.pandotxFallbackMode,
      })
    },
    down: IMPOSSIBLE,
  },
})
