export default {
  description: {
    short: {
      en_US:
        'Your private backend server for Ashigaru, Samourai Wallet and other light wallets.',
    },
    long: {
      en_US:
        'Dojo is the backend server for Ashigaru, Samourai Wallet and other light wallets. It provides HD account & loose addresses (BIP47) balances & transactions lists. Provides unspent output lists to the wallet. PushTX endpoint broadcasts transactions through the backing bitcoind node.',
    },
  },
  bitcoindDescription: {
    en_US:
      'Used to subscribe to new block events from a full archival node',
  },
  bitcoindTestnetDescription: {
    en_US:
      'Used to subscribe to new block events from a full archival node (testnet)',
  },
  fulcrumDescription: {
    en_US: 'Used for fast scan of addresses and indexing for deep wallets',
  },
  electrsDescription: {
    en_US: 'A more stable, but less performant indexer',
  },
}
