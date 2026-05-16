import { setupManifest } from '@start9labs/start-sdk'
import i18n from './i18n'

export const manifest = setupManifest({
  id: 'dojo',
  title: 'Dojo',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/ericpp/dojo-startos',
  upstreamRepo: 'https://github.com/Dojo-Open-Source-Project/samourai-dojo',
  marketingUrl: 'https://dojo-osp.org/',
  donationUrl: 'https://dojo-osp.org/donate/',
  docsUrls: [
    'https://dojo-osp.org/',
  ],
  description: i18n.description,
  volumes: ['main', 'db'],
  images: {
    dojo: {
      source: {
        dockerBuild: {
          dockerfile: './Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {
    bitcoind: {
      description: i18n.bitcoindDescription,
      optional: true,
      s9pk: null,
    },
    'bitcoind-testnet': {
      description: i18n.bitcoindTestnetDescription,
      optional: true,
      s9pk: null,
    },
    fulcrum: {
      description: i18n.fulcrumDescription,
      optional: true,
      s9pk: null,
    },
    electrs: {
      description: i18n.electrsDescription,
      optional: true,
      s9pk: null,
    },
  },
})
