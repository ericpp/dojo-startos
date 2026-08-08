import { FileHelper, IMPOSSIBLE, VersionInfo, z } from '@start9labs/start-sdk'
import { StoreJson, storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

/**
 * Both sources below are partial, and `write` — the only call that drops the
 * keys the legacy shapes leave behind — needs a whole store. Mirrors the
 * `.catch()` defaults the file model applies to a missing key.
 */
const withDefaults = (v: Partial<StoreJson>): StoreJson => ({
  bitcoinNode: v.bitcoinNode ?? 'bitcoind',
  indexer: v.indexer ?? 'fulcrum',
  paymentCode: v.paymentCode ?? null,
  adminKey: v.adminKey ?? '',
  apiKey: v.apiKey ?? '',
  jwtSecret: v.jwtSecret ?? '',
  sorobanAnnounce: v.sorobanAnnounce ?? false,
  pandotxProcess: v.pandotxProcess ?? false,
  pandotxPush: v.pandotxPush ?? true,
  pandotxRetries: v.pandotxRetries ?? 2,
  pandotxFallbackMode: v.pandotxFallbackMode ?? 'convenient',
})

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

/**
 * The nested store.json shape used up to 1.29.2:1. Both node fields hold a bare
 * string once flattened, so they catch to undefined rather than throwing — this
 * has to be able to read a store it has already converted.
 */
const legacyStore = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  z
    .object({
      bitcoinNode: z
        .object({ type: z.enum(['bitcoind', 'bitcoind-testnet']) })
        .optional()
        .catch(undefined),
      indexer: z
        .object({ type: z.enum(['fulcrum', 'electrs']) })
        .optional()
        .catch(undefined),
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

export const v_1_29_2_2 = VersionInfo.of({
  version: '1.29.2:2',
  releaseNotes: {
    en_US: `Rebuilt for StartOS 0.4 on start-sdk 2.0.

- Bitcoin, the indexer and Tor are now reached over the container bridge, so Dojo keeps working when their ports move.
- Database backups are taken from a consistent dump instead of a copy of the live data directory.
- Your API key, admin key and JWT secret are generated once and kept, so a restart no longer changes your pairing code.
- Testnet4 now talks to Bitcoin on its own RPC and ZeroMQ ports.
- Adds an action to view your admin key alongside the pairing code.`,
    es_ES: `Reconstruido para StartOS 0.4 sobre start-sdk 2.0.

- Bitcoin, el indexador y Tor ahora se alcanzan a través del puente de contenedores, así que Dojo sigue funcionando cuando cambian sus puertos.
- Las copias de seguridad de la base de datos se toman de un volcado consistente en lugar de una copia del directorio de datos en uso.
- Tu clave de API, tu clave de administración y tu secreto JWT se generan una vez y se conservan, de modo que un reinicio ya no cambia tu código de emparejamiento.
- Testnet4 ahora habla con Bitcoin en sus propios puertos RPC y ZeroMQ.
- Añade una acción para ver tu clave de administración junto al código de emparejamiento.`,
    de_DE: `Neu gebaut für StartOS 0.4 auf start-sdk 2.0.

- Bitcoin, der Indexer und Tor werden jetzt über die Container-Bridge erreicht, sodass Dojo weiterläuft, wenn sich deren Ports ändern.
- Datenbank-Backups werden aus einem konsistenten Dump erstellt statt aus einer Kopie des laufenden Datenverzeichnisses.
- Dein API-Schlüssel, dein Admin-Schlüssel und dein JWT-Secret werden einmal erzeugt und behalten, sodass ein Neustart deinen Pairing-Code nicht mehr ändert.
- Testnet4 spricht jetzt über seine eigenen RPC- und ZeroMQ-Ports mit Bitcoin.
- Fügt eine Aktion hinzu, um deinen Admin-Schlüssel neben dem Pairing-Code anzuzeigen.`,
    pl_PL: `Przebudowane dla StartOS 0.4 na start-sdk 2.0.

- Bitcoin, indekser i Tor są teraz osiągane przez mostek kontenerów, więc Dojo działa dalej, gdy zmienią się ich porty.
- Kopie zapasowe bazy danych powstają ze spójnego zrzutu zamiast kopii działającego katalogu danych.
- Twój klucz API, klucz administratora i sekret JWT są generowane raz i zachowywane, więc restart nie zmienia już kodu parowania.
- Testnet4 rozmawia teraz z Bitcoinem na własnych portach RPC i ZeroMQ.
- Dodaje akcję pozwalającą zobaczyć klucz administratora obok kodu parowania.`,
    fr_FR: `Reconstruit pour StartOS 0.4 sur start-sdk 2.0.

- Bitcoin, l'indexeur et Tor sont désormais joints via le pont de conteneurs, donc Dojo continue de fonctionner lorsque leurs ports changent.
- Les sauvegardes de la base de données proviennent d'un export cohérent plutôt que d'une copie du répertoire de données en cours d'utilisation.
- Votre clé d'API, votre clé d'administration et votre secret JWT sont générés une seule fois et conservés, si bien qu'un redémarrage ne change plus votre code d'appairage.
- Testnet4 dialogue maintenant avec Bitcoin sur ses propres ports RPC et ZeroMQ.
- Ajoute une action pour consulter votre clé d'administration à côté du code d'appairage.`,
  },
  migrations: {
    up: async ({ effects }) => {
      // A store.json settles it either way: `dojo` means 1.29.2:1 and below,
      // which nested most of the config under it — flatten it so the keys
      // survive, since losing adminKey/apiKey would silently mint new ones and
      // break every already-paired wallet. No `dojo` means that already
      // happened. Writing rather than merging is what drops the nested keys;
      // a merge keeps them, leaving this branch permanently armed.
      const store = await legacyStore.read().once()
      if (store) {
        const dojo = store.dojo
        if (dojo)
          await storeJson.write(
            effects,
            withDefaults({
              bitcoinNode: store.bitcoinNode?.type,
              indexer: store.indexer?.type,
              paymentCode: dojo.paymentCode,
              adminKey: dojo.adminKey,
              apiKey: dojo.apiKey,
              jwtSecret: dojo.jwtSecret,
              sorobanAnnounce: dojo.sorobanAnnounce?.enabled === 'enabled',
              pandotxProcess: dojo.sorobanAnnounce?.pandotxProcess,
              pandotxPush: dojo.pandotxPush,
              pandotxRetries: dojo.pandotxRetries,
              pandotxFallbackMode: dojo.pandotxFallbackMode,
            }),
          )
        return
      }

      // 1.29.2:1 deleted `start9/` once it had imported it, so a config.yaml
      // still on disk with no store.json beside it is a 0.3.5.1 install that
      // never passed through it.
      const yaml = await legacyYaml.read().once()
      if (!yaml) return
      await storeJson.write(
        effects,
        withDefaults({
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
        }),
      )
    },
    down: IMPOSSIBLE,
  },
})
