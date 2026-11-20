import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.29.2:9',
  releaseNotes: {
    en_US:
      'The package now verifies the Tor and Soroban sources it builds: Tor against its release commit, Soroban against a pinned checksum.',
    es_ES:
      'El paquete ahora verifica el código fuente de Tor y Soroban que compila: Tor con el commit de su versión y Soroban con una suma de comprobación fijada.',
    de_DE:
      'Das Paket prüft jetzt den Quellcode von Tor und Soroban, den es baut: Tor gegen seinen Release-Commit, Soroban gegen eine festgelegte Prüfsumme.',
    pl_PL:
      'Pakiet weryfikuje teraz budowany kod źródłowy Tor i Soroban: Tor względem commita wydania, Soroban względem przypiętej sumy kontrolnej.',
    fr_FR:
      'Le paquet vérifie désormais le code source de Tor et de Soroban qu’il compile : Tor par rapport au commit de sa version, Soroban par rapport à une somme de contrôle fixée.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
