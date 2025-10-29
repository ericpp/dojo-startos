import { compat, types as T } from '../deps.ts'

export const migration: T.ExpectedExports.migration = compat.migrations.fromMapping(
  {
    '1.28.0.0': {
      up: compat.migrations.updateConfig(
        (config: any) => {
          // Add default soroban-announce config for users upgrading from versions before 1.28.0
          if (!config['soroban-announce']) {
            config['soroban-announce'] = {
              enabled: 'disabled',
            }
          }
          return config
        },
        true,
        { version: '1.28.0.0', type: 'up' },
      ),
      down: compat.migrations.updateConfig(
        (config: any) => {
          // Remove soroban-announce config when downgrading
          delete config['soroban-announce']
          return config
        },
        true,
        { version: '1.28.0.0', type: 'down' },
      ),
    },
  },
  '1.27.0.0',
)
