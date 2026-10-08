import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.29.2:5',
  releaseNotes: {
    en_US: `- Dojo requires Bitcoin 28.4:29, 29.4:16, 30.3:16 or 31.1:16 or newer, depending on the Bitcoin version line you are on.
- Select Bitcoin Node, Select Indexer and the Soroban settings in Configure Dojo explain each of their options.`,
    es_ES: `- Dojo requiere Bitcoin 28.4:29, 29.4:16, 30.3:16 o 31.1:16 o posterior, según la línea de versiones de Bitcoin que uses.
- «Seleccionar nodo Bitcoin», «Seleccionar indexador» y los ajustes de Soroban de «Configurar Dojo» explican cada una de sus opciones.`,
    de_DE: `- Dojo benötigt Bitcoin 28.4:29, 29.4:16, 30.3:16 oder 31.1:16 oder neuer, je nachdem, welche Bitcoin-Versionsreihe du nutzt.
- „Bitcoin-Knoten auswählen“, „Indexer auswählen“ und die Soroban-Einstellungen in „Dojo konfigurieren“ erklären jede ihrer Optionen.`,
    pl_PL: `- Dojo wymaga Bitcoina 28.4:29, 29.4:16, 30.3:16 lub 31.1:16 albo nowszego, zależnie od linii wydań Bitcoina, z której korzystasz.
- „Wybierz węzeł Bitcoina”, „Wybierz indekser” oraz ustawienia Soroban w „Skonfiguruj Dojo” objaśniają każdą ze swoich opcji.`,
    fr_FR: `- Dojo nécessite Bitcoin 28.4:29, 29.4:16, 30.3:16 ou 31.1:16 ou plus récent, selon la ligne de versions de Bitcoin que vous utilisez.
- « Sélectionner le nœud Bitcoin », « Sélectionner l'indexeur » et les réglages Soroban de « Configurer Dojo » expliquent chacune de leurs options.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
