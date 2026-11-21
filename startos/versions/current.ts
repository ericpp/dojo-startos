import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.29.3:0',
  releaseNotes: {
    en_US:
      'Updates Samourai Dojo to 1.29.3. Upstream only fixed file permissions in its MariaDB Docker image, which this package does not use, so nothing changes in how Dojo runs.',
    es_ES:
      'Actualiza Samourai Dojo a 1.29.3. Upstream solo corrigió los permisos de archivos en su imagen Docker de MariaDB, que este paquete no utiliza, por lo que el funcionamiento de Dojo no cambia.',
    de_DE:
      'Aktualisiert Samourai Dojo auf 1.29.3. Upstream hat nur Dateiberechtigungen in seinem MariaDB-Docker-Image korrigiert, das dieses Paket nicht verwendet; am Betrieb von Dojo ändert sich daher nichts.',
    pl_PL:
      'Aktualizuje Samourai Dojo do wersji 1.29.3. Upstream poprawił jedynie uprawnienia plików w swoim obrazie Docker MariaDB, z którego ten pakiet nie korzysta, więc działanie Dojo się nie zmienia.',
    fr_FR:
      "Met à jour Samourai Dojo vers 1.29.3. L'amont a uniquement corrigé les permissions de fichiers de son image Docker MariaDB, que ce paquet n'utilise pas ; le fonctionnement de Dojo reste donc inchangé.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
