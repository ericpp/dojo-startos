import { compat, types as T } from "../deps.ts"

export const migration: T.ExpectedExports.migration = compat.migrations.fromMapping(
  {
    "1.28.0.0": {
      up: compat.migrations.updateConfig(
        (config: any) => {
          // Add default soroban and pandotx config for users upgrading from versions before 1.28.0
          config["soroban-announce"] = {
            enabled: "disabled",
          }
          config["pandotx-push"] = true
          config["pandotx-retries"] = 2
          config["pandotx-fallback-mode"] = "convenient"
          return config
        },
        true,
        { version: "1.28.0.0", type: "up" },
      ),
      down: compat.migrations.updateConfig(
        (config: any) => {
          delete config["soroban-announce"]
          delete config["pandotx-push"]
          delete config["pandotx-retries"]
          delete config["pandotx-fallback-mode"]
          return config
        },
        true,
        { version: "1.28.0.0", type: "down" },
      ),
    },
  },
  "1.28.0.0",
)
