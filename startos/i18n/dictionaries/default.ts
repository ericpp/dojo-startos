export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Dojo!': 0,
  'Tor Address': 1,
  'Wallets can pair over Tor': 2,
  'Add a Tor address to a Dojo interface — wallets pair over the onion address, and Dojo cannot issue a pairing code without one': 3,
  Database: 4,
  'The database is accepting connections': 5,
  'The database is starting...': 6,
  Soroban: 7,
  'Soroban is running': 8,
  'Soroban is starting...': 9,
  'Dojo API': 10,
  'The Dojo API is accepting connections': 11,
  'The Dojo API is starting...': 12,
  'Web Server': 13,
  'The web server is ready': 14,
  'The web server is not ready': 15,
  'Transaction Broadcast': 16,
  'Dojo can broadcast transactions': 17,
  'The broadcast endpoint is starting...': 18,
  'Sync Progress': 19,
  'Dojo is caught up with the chain': 20,
  'Dojo is syncing...': 21,

  // interfaces.ts
  'Maintenance Tool': 22,
  "Dojo's admin interface, for managing your Dojo": 71,
  'Wallet API': 72,
  'The endpoint wallets pair to and query': 73,

  // dependencies.ts
  'Dojo needs pruning disabled and txindex and ZeroMQ enabled in Bitcoin': 23,

  // actions/selectBitcoinNode.ts
  'Select Bitcoin Node': 24,
  'Choose which Bitcoin node Dojo tracks': 25,
  'Switching networks leaves Dojo tracking a chain its database was not built for. Only change this on a fresh Dojo.': 26,
  Configuration: 27,
  'Bitcoin Node': 28,
  Bitcoin: 29,
  'Bitcoin (testnet4)': 30,

  // actions/selectIndexer.ts
  'Select Indexer': 31,
  'Choose which indexer Dojo looks addresses up in': 32,
  Indexer: 33,
  Fulcrum: 34,
  Electrs: 35,

  // actions/configureDojo.ts
  'Configure Dojo': 36,
  'Set the keys wallets authenticate with, and how Dojo broadcasts transactions': 37,
  'Changing a key invalidates the pairing code, and every paired wallet has to be paired again.': 38,
  'BIP47 Payment Code': 39,
  'A PayNym payment code that can sign in to the maintenance tool in place of the admin key': 40,
  'API Key': 41,
  'The key wallets authenticate to Dojo with': 42,
  'Admin Key': 43,
  'The key that signs in to the maintenance tool': 44,
  'JWT Secret': 45,
  'The secret Dojo signs its session tokens with': 46,
  'Soroban Network': 47,
  "Whether other Soroban users can reach the Soroban network through this Dojo.\n- Do not announce: only this Dojo uses its Soroban node.\n- Announce: the node's address is published, so other users can interact with the Soroban network through it.": 48,
  'Do not announce': 49,
  Announce: 50,
  'Relay Transactions': 51,
  'Broadcast transactions that other Soroban nodes hand to this one': 52,
  'Broadcast Through Soroban': 53,
  'Send your own transactions through a randomly chosen Soroban node, so they are not first seen at your node': 54,
  'If Soroban Broadcast Fails': 55,
  'What happens to a transaction no Soroban node accepts.\n- Broadcast from this node instead: the transaction is still broadcast, from your own node.\n- Do not broadcast: your own node does not broadcast it either, and the wallet is not told it failed.': 56,
  'Broadcast from this node instead': 57,
  'Do not broadcast': 58,
  'Soroban Broadcast Retries': 59,
  'How many other Soroban nodes to try before falling back': 60,

  // actions/viewCredentials.ts
  'View Pairing Code': 61,
  'Show the pairing code your wallet scans, and the key that signs in to the maintenance tool': 62,
  Credentials: 63,
  'Pairing Code': 64,
  'Scan the pairing code from your wallet. Use the admin key to sign in to the Dojo Maintenance Tool.': 65,
  'Pairs a wallet with this Dojo': 66,
  'Signs in to the Dojo Maintenance Tool': 67,
  'Bitcoin Client': 68,
  'Bitcoin is a client Dojo supports': 69,
  'Waiting for Bitcoin...': 70,
  'The network Dojo tracks.\n- Bitcoin: mainnet, from the Bitcoin service.\n- Bitcoin (testnet4): testnet4, from the Bitcoin (testnet4) service.': 74,
  'Where Dojo looks up address history. The indexer you pick must be installed.\n- Fulcrum: reads from the Fulcrum service.\n- Electrs: reads from the Electrs service.': 75,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
