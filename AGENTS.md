# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Upstream is a git submodule** — `git submodule update --init` before building. The Dockerfile builds from it plus Tor and Soroban from source, so a cold image build is slow.
- **The four daemons must keep sharing one `SubContainer` instance.** MariaDB, Soroban, the API under pm2, and nginx talk to each other over `127.0.0.1`; splitting them breaks every internal connection.
- **`main.ts` is the only place that resolves addresses.** Never reintroduce `<pkg>.startos` DNS names or hardcoded dependency ports — they are deprecated and the ports are assigned dynamically. Pin `ssl: false` on the Bitcoin RPC and indexer lookups: both publish a plaintext _and_ a TLS bridge address, and Dojo speaks the plain one.
- **`assets/config.env` maps `S9_*` onto the names Dojo reads, and the ordering is load-bearing.** It sources upstream's own `docker/my-dojo/.env` first for Dojo's defaults, then applies what StartOS resolved. Setting an upstream name (`NODE_API_KEY`, `BITCOIND_IP`, …) directly from `main.ts` would be clobbered by that source.
- **The entrypoint and health scripts live in `assets/`**, mounted read-only and invoked as `['bash', '/assets/<script>']` — not baked in, because a script edit should not pay for recompiling Tor and Soroban. Keep new scripts there; the only one still copied into the image is upstream's `soroban-restart.sh`, from the submodule.
- **The three secrets are minted once** by `init/seedSecrets.ts` and persisted. Do not give them generated defaults in the file model — a `.catch()` default is evaluated per process and never written back, so every restart would hand out a new API key and change the user's pairing code.
- **Knots is excluded by flavor, not by a version floor.** Dojo exits on any node whose subversion contains "Knots" (`lib/bitcoind-rpc/rpc-client.js`), and Knots tracks Core's majors — so a floor above its current line would stop excluding it the moment it caught up. The exclusion belongs in the dependency range, where it presents as an unmet dependency rather than a crash-looping accounts API.
- **The slow triggers on `tor-address` and `bitcoin-client` are deliberate.** Neither is a transient failure the default 1-second failure cadence is for: the onion address only changes on a restart, and each Bitcoin-client poll is an RPC round trip that would otherwise hammer Bitcoin forever.
- **`bc` is not in the image.** Compute percentages with bash arithmetic.
