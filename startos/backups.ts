import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { dbDir, mysqlDatabase, mysqlUser } from './utils'

// MariaDB writes its data directory continuously while Dojo runs, so rsyncing
// it produces a torn copy. Dump it instead, and back up the Dojo state volume
// alongside.
export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.withMariadbDump({
    imageId: 'dojo',
    dbVolume: 'db',
    datadir: dbDir,
    database: mysqlDatabase,
    user: mysqlUser,
    password: async () => {
      const password = await storeJson.read((s) => s.mysqlPassword).once()
      if (!password) throw new Error('No store.json')
      return password
    },
  }).addVolume('main'),
)
