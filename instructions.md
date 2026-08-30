# Dojo

## Documentation

- [Start9 Bitcoin Guides](https://docs.start9.com/bitcoin-guides/) — connecting a wallet to your own Bitcoin node, and which wallets work on which platforms.
- [Dojo Open Source Project](https://dojo-osp.org/) — the upstream project site, with the
  maintenance tool guide and wallet pairing documentation.

## What you get on StartOS

A private backend your wallet talks to instead of a public server. Dojo keeps its own index of your
HD and BIP47 accounts, answers balance and history queries from that index, and broadcasts your
transactions through your own Bitcoin node.

It exposes two interfaces on the same address: the **Maintenance Tool**, which you open in a
browser to manage your Dojo, and the **Wallet API**, which is what your wallet pairs to and queries. Your API key, admin key and JWT secret are generated for you on install — you
never have to invent them, and they do not change when Dojo restarts.

## Getting set up

1. **Install Tor** if it is not already installed, and give Dojo a Tor address: open either of
   Dojo's interfaces and add one — they share it. Wallets pair to Dojo over its onion address, so
   Dojo will not start without one.
2. **Install Bitcoin** (or Bitcoin (testnet4), if you chose testnet). Dojo will ask you to confirm a
   change to Bitcoin's settings — it needs pruning turned off and txindex and ZeroMQ turned on. Accept
   it; the values are filled in for you. Dojo does not work with Bitcoin Knots; if that is what you
   run, StartOS will show the Bitcoin dependency as unsatisfied.
3. **Install an indexer** — Fulcrum or Electrs. Fulcrum rescans deep wallets faster; Electrs uses
   less disk. Run **Select Indexer** if you want the one Dojo did not ask for by default.
4. **Start Dojo.** The first start builds its database, so give it a few minutes.
5. **Wait for Sync Progress to turn green.** Dojo imports from your indexer and follows your node
   from there. A fresh Bitcoin node or a fresh index has to finish first.

> Running on testnet4 instead of mainnet? Run **Select Bitcoin Node** before you start Dojo for the
> first time. Dojo's database is built for one chain, so switching later leaves it tracking the
> wrong one.

## Using Dojo

### Pairing a wallet

Run **View Pairing Code** once Dojo is running. It shows a QR code your wallet scans — Ashigaru,
Samourai Wallet, Sparrow and other Dojo-aware wallets all accept it — and, below it, your admin
key.

### The Dojo Maintenance Tool

Open the **Maintenance Tool** interface in a Tor-capable browser. Sign in with the admin key from
**View Pairing Code**. From there you can see the status of your Dojo, your node, your indexer and the
database; broadcast a raw transaction; and run a custom scan of a wallet.

If you would rather sign in with a PayNym than a key, set a BIP47 payment code in **Configure
Dojo**.

### Broadcasting through Soroban

By default Dojo pushes your transactions through a randomly chosen Soroban node, so they are not
first seen at your own node. **Configure Dojo** controls this: how many nodes to try, whether to
fall back to your own node if none accept, and whether to announce your Dojo to the Soroban network
so it relays for others.

## Limitations

- **The block explorer links in your wallet go to mempool.space over Tor.** Dojo normally ships
  with its own explorer; this package does not include one and points your wallet at mempool.space's
  hidden service instead. Looking up a transaction through that link asks a third party about it.
- **Dojo will not run without a Tor address**, even on your LAN, because the pairing code it hands
  your wallet is an onion URL.
- **Bitcoin Knots is not supported.** Dojo's authors chose not to work with it, and Dojo quits on
  startup if the node it is pointed at identifies as Knots. You need Bitcoin Core. The **Bitcoin
  Client** health check will tell you if this is what is stopping it.
