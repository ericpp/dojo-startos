import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'dojo',
  title: 'Dojo',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/Start9-Community/dojo-startos',
  upstreamRepo: 'https://github.com/Dojo-Open-Source-Project/samourai-dojo',
  marketingUrl: 'https://dojo-osp.org/',
  donationUrl: 'https://dojo-osp.org/donate/',
  description: { short, long },
  volumes: ['main', 'db'],
  images: {
    dojo: {
      source: { dockerBuild: { dockerfile: './Dockerfile', workdir: '.' } },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: false,
    },
  },
})
