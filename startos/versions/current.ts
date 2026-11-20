import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.29.2:9',
  releaseNotes: {
    en_US:
      'The package now verifies the Tor and Soroban sources it builds: Tor against its release commit, Soroban against a pinned checksum. On mainnet, with a Bitcoin too old to publish the RPC credential Dojo reads, Dojo no longer fails to start: it waits and tells you to update Bitcoin.',
    es_ES:
      'El paquete ahora verifica el código fuente de Tor y Soroban que compila: Tor con el commit de su versión y Soroban con una suma de comprobación fijada. En mainnet, con un Bitcoin demasiado antiguo para publicar la credencial RPC que Dojo lee, Dojo ya no falla al iniciarse: espera y te indica que actualices Bitcoin.',
    de_DE:
      'Das Paket prüft jetzt den Quellcode von Tor und Soroban, den es baut: Tor gegen seinen Release-Commit, Soroban gegen eine festgelegte Prüfsumme. Im Mainnet startet Dojo mit einem Bitcoin, das zu alt ist, um die von Dojo gelesenen RPC-Zugangsdaten bereitzustellen, nicht mehr fehlerhaft: Es wartet und fordert dich auf, Bitcoin zu aktualisieren.',
    pl_PL:
      'Pakiet weryfikuje teraz budowany kod źródłowy Tor i Soroban: Tor względem commita wydania, Soroban względem przypiętej sumy kontrolnej. Na mainnecie, gdy Bitcoin jest zbyt stary, by udostępniać dane uwierzytelniające RPC odczytywane przez Dojo, Dojo nie kończy już uruchamiania błędem: czeka i prosi o aktualizację Bitcoina.',
    fr_FR:
      'Le paquet vérifie désormais le code source de Tor et de Soroban qu’il compile : Tor par rapport au commit de sa version, Soroban par rapport à une somme de contrôle fixée. Sur mainnet, avec un Bitcoin trop ancien pour publier l’identifiant RPC que Dojo lit, Dojo n’échoue plus au démarrage : il attend et vous invite à mettre Bitcoin à jour.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
