import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { generateKey } from '../utils'

/** Matches the length my-dojo generates for the same three values upstream. */
const KEY_LENGTH = 22

/**
 * Mint Dojo's three secrets once and persist them. They cannot be file-model
 * defaults: a generated `.catch()` default is evaluated per process and never
 * written back, so every restart would hand out a different API key and change
 * the user's pairing code. Also seeds the rest of store.json on a fresh
 * install, so the entrypoints always find a complete file, and mints the
 * MariaDB account's password before the database is first created.
 */
export const seedSecrets = sdk.setupOnInit(async (effects, kind) => {
  const store = await storeJson.read().once()
  await storeJson.merge(effects, {
    adminKey: store?.adminKey || generateKey(KEY_LENGTH),
    apiKey: store?.apiKey || generateKey(KEY_LENGTH),
    jwtSecret: store?.jwtSecret || generateKey(KEY_LENGTH),
    ...(kind === 'install' && { mysqlPassword: generateKey(32) }),
  })
})
