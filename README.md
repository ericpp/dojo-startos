<p align="center">
  <img src="icon.png" alt="Dojo Logo" width="21%">
</p>

# Dojo on StartOS

> Everything not listed in this document should behave the same as upstream
> Dojo. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation
> section of `instructions.md` for links.

[Dojo](https://github.com/Dojo-Open-Source-Project/samourai-dojo) is a personal Bitcoin backend: wallets pair to it and query their own history through it, instead of through someone else's server. This package runs Dojo's whole stack in one container, lets you pick which Bitcoin node and which indexer it reads from, and manages the secrets that make up its pairing code.

- **Upstream repo:** <https://github.com/Dojo-Open-Source-Project/samourai-dojo>
- **Wrapper repo:** <https://github.com/Start9-Community/dojo-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One image, built here, running four daemons.

| Property      | Value                               |
| ------------- | ----------------------------------- |
| Image         | Built from this repo's `Dockerfile` |
| Architectures | x86_64, aarch64                     |
| Command       | Per daemon, from mounted scripts    |

| Subcontainer | Purpose                                   |
| ------------ | ----------------------------------------- |
| `dojo-sub`   | All four daemons — the one to `attach` to |

The four daemons are MariaDB, Soroban, Dojo's API backend, and the nginx front end. They share the one subcontainer and the service network namespace.

**The entrypoint and health scripts are mounted from assets, not baked into the image.** Editing one would otherwise mean rebuilding a Dockerfile that compiles Tor and Soroban from source — so the scripts are a mount and a rebuild is not needed to change them.

## Volume and Data Layout

Two volumes, plus a read-only view of Bitcoin's.

| Volume                | Mount Point      | Purpose                                       |
| --------------------- | ---------------- | --------------------------------------------- |
| `main`                | `/data`          | Dojo's state, the store, and the pairing data |
| `db`                  | `/var/lib/mysql` | MariaDB's data directory                      |
| Bitcoin's `main` (ro) | `/mnt/bitcoin`   | The RPC cookie                                |

The database is on its own volume because it is backed up differently — see [Backups and Restore](#backups-and-restore).

## File Models

Two models: one the package owns, and one the container writes for the package to read.

| File           | Format | Modelled                | Written by           |
| -------------- | ------ | ----------------------- | -------------------- |
| `store.json`   | JSON   | Yes — `FileHelper.json` | Init and the actions |
| `backend.json` | JSON   | Yes — `FileHelper.json` | The backend daemon   |

**`store.json`** holds the node and indexer selections, Dojo's three secrets, and the Soroban and broadcast settings.

**The three secrets are seeded at init, deliberately not defaulted.** A generated `.catch()` default is evaluated per process and never written back — which would hand out a different API key on every restart and silently change the user's pairing code. So they are minted once and persisted, and an empty value means "not generated yet" rather than a usable key.

**`backend.json` carries the pairing code, and it is written from inside the container** because the payload embeds Dojo's own version tag, which only the image knows. The package reads it back out for the action rather than assembling it.

Dojo's own configuration is not modelled. Everything the package needs to set is passed as environment under `S9_`-prefixed names, and a config script inside the container maps those onto the names Dojo actually reads. **That indirection is load-bearing**: the script sources upstream's own defaults, which would overwrite anything set directly under the upstream names.

## Dependencies

Five declared, and which are actually required depends on two selections.

| Dependency       | Role                                   |
| ---------------- | -------------------------------------- |
| Tor              | **Always required**, `kind: 'running'` |
| Bitcoin          | Required when mainnet is selected      |
| Bitcoin testnet4 | Required when testnet is selected      |
| Fulcrum          | Required when selected as the indexer  |
| Electrs          | Required when selected as the indexer  |

Exactly one Bitcoin node and one indexer are required at a time; the manifest marks them optional because the choice is the user's.

**Bitcoin needs three settings, and the package raises a recurring task for them.** Dojo reads raw transactions over RPC and subscribes to blocks over ZeroMQ, and a pruned or unindexed node can serve neither. The task is declared to recur rather than fire once, so turning any of them back off brings it back.

**Bitcoin Knots is excluded, by flavor rather than by version.** Dojo exits on any node whose subversion contains "Knots", so both Knots flavors are ruled out in the dependency range itself — a crash-loop in the accounts API is otherwise the only symptom. It is excluded by flavor because Knots tracks Core's majors, so a version floor would stop excluding it the moment Knots caught up.

**The indexer only has to be answering, not fully indexed.** Blocking start-up on a first index would leave the service unavailable for hours, and Dojo reports its own import progress anyway.

The Bitcoin RPC address is pinned to the plaintext leg, as is the indexer's — both publish a plaintext and a TLS address, and Dojo speaks the plain one.

## Network Access and Interfaces

**Two interfaces on one port**, because nginx fronts both.

| Interface        | Id    | Type | Port | Path      | Description                    |
| ---------------- | ----- | ---- | ---- | --------- | ------------------------------ |
| Maintenance Tool | `ui`  | ui   | 9000 | `/admin/` | Dojo's admin interface         |
| Wallet API       | `api` | api  | 9000 | `/v2/`    | What wallets pair to and query |

They are separate interfaces because they have different audiences — a person opens one in a browser, a wallet pairs to the other — and because the API path is the URL the pairing code actually carries.

**Wallets pair over Tor, and a Tor address is effectively required.** Dojo cannot issue a pairing code without one, which is why the package raises a health check about it rather than leaving the user to discover an empty code.

The host id is kept from the pre-2.0 package deliberately: it carries the user's onion address, and renaming it would orphan that address and break every paired wallet.

## Installation and First-Run Flow

Install mints Dojo's three secrets and seeds the rest of the store, so the container's entrypoints always find a complete file.

Then the ordering is dictated by the dependencies rather than by the package:

1. **Add a Tor address** to a Dojo interface. Without one there is no pairing code.
2. **Satisfy Bitcoin's settings** — the task will be waiting on Bitcoin's own page.
3. **Choose the node and the indexer** if the defaults are not what you want.

The service starts the database, then Soroban, then the backend, then the front end. Several of those carry long grace periods because a first start includes database initialization, and the sync check's grace is measured in minutes because Dojo's initial import genuinely takes that long.

## Actions

Four actions, in two groups.

### Select Bitcoin Node — Configuration

Chooses mainnet Bitcoin or testnet4. Run it once, before pairing anything.

- **What it changes:** the selection in the store — and with it the declared dependency, the mounted cookie, the RPC and ZeroMQ addresses, and which node the autoconfig task targets.
- **Cost:** the service restarts and reconnects.
- **Repeat safety:** idempotent, but **switching networks is not a migration** — Dojo's database is keyed to one chain, and moving it invalidates the imported history.

### Select Indexer — Configuration

Chooses Fulcrum or Electrs.

- **What it changes:** the selection in the store, the declared dependency, and the address Dojo reads from.
- **Cost:** the service restarts.
- **Repeat safety:** idempotent. Both serve the same protocol, so switching is a genuine swap rather than a migration.

### Configure Dojo — Configuration

Everything else: the BIP47 payment code, the three secrets, and the Soroban and broadcast behavior.

- **What it changes:** the corresponding fields in the store.
- **Cost:** the service restarts.
- **Changing a secret changes the pairing code**, so every paired wallet has to be re-paired. That is the one setting here with a cost outside this service.
- **Soroban announcement and transaction relay are separate switches**, and relaying is only meaningful when announcing.

### View Pairing Code — Credentials

Shows the code a wallet scans, plus the admin key.

- **When to run it:** only while the service is running — the code is written by the backend at start-up.
- **What it changes:** nothing. It is a read.
- **Repeat safety:** read-only, and stable: the same code until a secret changes.
- **It returns nothing useful without a Tor address**, since the code is built around the onion.

## Tasks

One, and it appears on **Bitcoin's** page rather than this one.

| Task                     | Severity   | Raised when                           | Cleared when                   |
| ------------------------ | ---------- | ------------------------------------- | ------------------------------ |
| Bitcoin's Auto-Configure | `critical` | Bitcoin lacks the settings Dojo needs | Bitcoin's settings are changed |

It requires pruning off, the transaction index on, and ZeroMQ on. It is declared **recurring**, so it comes back if any of the three is turned off again — it is a standing requirement, not a setup step.

It follows the node selection: choosing testnet retargets the task at the testnet package.

## Health Checks

Six checks. Four are daemons, two are conditions the daemons cannot report.

| Check            | Displayed as            | Method                                | Grace / cadence        |
| ---------------- | ----------------------- | ------------------------------------- | ---------------------- |
| `mariadb`        | "Database"              | The database is answering             | 120s grace             |
| `soroban`        | "Soroban"               | The Soroban daemon                    | default                |
| `backend`        | "Dojo API"              | The API is answering                  | 120s grace             |
| `frontend`       | "Web Server"            | nginx is serving                      | 120s grace             |
| `tor-address`    | "Tor Address"           | Whether an onion address exists       | polled every 30s       |
| `bitcoin-client` | "Bitcoin Client"        | Whether Bitcoin is a supported client | 30s, 5s while starting |
| `pushtx`         | "Transaction Broadcast" | The broadcast path                    | default                |
| `synced`         | "Sync Progress"         | Dojo's own import progress            | 720s grace             |

**"Tor Address" failing is a prompt, not a fault.** It tells the user to add an onion address, because without one Dojo cannot issue a pairing code. It polls on a fixed 30-second cooldown rather than the default failure cadence — the address only changes on a restart, and re-reporting it every second floods the log while the user goes to add one.

**"Bitcoin Client" is what catches an unsupported node** before it presents as a crash-looping accounts API. It also polls slowly on purpose: each poll is an RPC round trip, and an unsupported client stays unsupported until the user changes it.

**"Sync Progress" has a twelve-minute grace** because Dojo's initial import is genuinely long. A new install sitting in that state is working, not stuck.

## Backups and Restore

**The database is dumped; everything else is copied.** `sdk.Backups.withMysqlDump` handles MariaDB and the `main` volume is added alongside.

MariaDB writes its data directory continuously while Dojo runs, so copying those files produces a torn database. A logical dump is consistent, and it also survives a future engine bump instead of being tied to the on-disk format it was taken with. **The `db` volume's files are never captured** — a restore starts the engine and replays the dump into it.

The `main` volume carries the store, so **the secrets and therefore the pairing code survive a restore** and wallets stay paired — provided the Tor address does too.

A restored instance needs its dependencies present on the new server, and re-imports nothing: the database comes back with its history.

## Limitations and Differences

1. **Bitcoin Knots is not supported.** Dojo exits on it, so both Knots flavors are excluded at the dependency level.
2. **Bitcoin must be unpruned, with the transaction index and ZeroMQ on** — a standing requirement, enforced by a recurring task.
3. **A Tor address is effectively mandatory**, because pairing is built around the onion.
4. **Switching networks is not a migration.** The database is keyed to one chain.
5. **Changing any of the three secrets invalidates every paired wallet.**
6. **Dojo's own configuration is not exposed** beyond what the actions cover; everything else is upstream's default.
7. **The maintenance tool and the wallet API share one port**, distinguished by path.

---

## Quick Reference for AI Consumers

```yaml
package_id: dojo
image: built from ./Dockerfile
architectures:
  - x86_64
  - aarch64
subcontainers:
  - dojo-sub # mariadb, soroban, backend and frontend daemons
volumes:
  main: /data
  db: /var/lib/mysql # bitcoin's main volume is mounted read-only at /mnt/bitcoin
file_models:
  - store.json
  - backend.json # written by the container, read by the pairing action
startos_managed_env_vars: # S9_-prefixed; a container script maps them to Dojo's own names
  - S9_DATA_DIR
  - S9_TOR_ADDRESS
  - S9_TOR_SOCKS_HOST
  - S9_TOR_SOCKS_PORT
  - S9_BITCOIN_NETWORK
  - S9_BITCOIN_RPC_HOST
  - S9_BITCOIN_RPC_PORT
  - S9_BITCOIN_ZMQ_BLOCK
  - S9_BITCOIN_ZMQ_TX
  - S9_BITCOIN_COOKIE
  - S9_INDEXER_TYPE
  - S9_INDEXER_HOST
  - S9_INDEXER_PORT
  - S9_API_KEY
  - S9_ADMIN_KEY
  - S9_JWT_SECRET
  - S9_PAYMENT_CODE
  - S9_SOROBAN_ANNOUNCE
  - S9_PANDOTX_PROCESS
  - S9_PANDOTX_PUSH
  - S9_PANDOTX_FALLBACK
  - S9_PANDOTX_RETRIES
dependencies:
  - tor # always required, kind: running
  - bitcoind # required on mainnet; Knots flavors excluded
  - bitcoind-testnet # required on testnet4
  - fulcrum # required when selected
  - electrs # required when selected
interfaces: # both on port 9000, split by path
  ui: { type: ui, port: 9000, path: /admin/ }
  api: { type: api, port: 9000, path: /v2/ }
actions:
  - select-bitcoin-node
  - select-indexer
  - configure-dojo
  - view-credentials # only-running
tasks:
  - { action: 'bitcoind:autoconfig', severity: critical } # on Bitcoin's page, recurring
health_checks:
  - mariadb # displayed "Database"
  - soroban # displayed "Soroban"
  - backend # displayed "Dojo API"
  - frontend # displayed "Web Server"
  - tor-address # displayed "Tor Address"
  - bitcoin-client # displayed "Bitcoin Client"
  - pushtx # displayed "Transaction Broadcast"
  - synced # displayed "Sync Progress"
```
