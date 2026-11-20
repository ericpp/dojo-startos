import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.29.2:8',
  releaseNotes: {
    en_US: `Requires StartOS 0.4.2 or later.

- On mainnet, Dojo connects to Bitcoin without being able to read its data directory. Update Bitcoin if StartOS reports that its version is not supported.
- New installs give Dojo's database a password unique to the install, and the database password is no longer written to the logs.
- Dojo's database is reachable only from inside Dojo.`,
    es_ES: `Requiere StartOS 0.4.2 o posterior.

- En mainnet, Dojo se conecta a Bitcoin sin poder leer su directorio de datos. Actualiza Bitcoin si StartOS indica que su versión no es compatible.
- Las nuevas instalaciones asignan a la base de datos de Dojo una contraseña única para cada instalación, y la contraseña de la base de datos ya no se escribe en los registros.
- La base de datos de Dojo solo es accesible desde dentro de Dojo.`,
    de_DE: `Erfordert StartOS 0.4.2 oder neuer.

- Im Mainnet verbindet sich Dojo mit Bitcoin, ohne dessen Datenverzeichnis lesen zu können. Aktualisiere Bitcoin, wenn StartOS meldet, dass seine Version nicht unterstützt wird.
- Neue Installationen geben der Datenbank von Dojo ein eigenes Passwort pro Installation, und das Datenbankpasswort wird nicht mehr in die Protokolle geschrieben.
- Die Datenbank von Dojo ist nur noch innerhalb von Dojo erreichbar.`,
    pl_PL: `Wymaga StartOS 0.4.2 lub nowszego.

- W sieci mainnet Dojo łączy się z Bitcoinem bez możliwości odczytu jego katalogu danych. Zaktualizuj Bitcoin, jeśli StartOS zgłasza, że jego wersja nie jest obsługiwana.
- Nowe instalacje nadają bazie danych Dojo hasło unikalne dla instalacji, a hasło bazy danych nie jest już zapisywane w logach.
- Baza danych Dojo jest dostępna tylko z wnętrza Dojo.`,
    fr_FR: `Nécessite StartOS 0.4.2 ou une version ultérieure.

- Sur le mainnet, Dojo se connecte à Bitcoin sans pouvoir lire son répertoire de données. Mettez à jour Bitcoin si StartOS indique que sa version n'est pas prise en charge.
- Les nouvelles installations attribuent à la base de données de Dojo un mot de passe propre à l'installation, et le mot de passe de la base de données n'est plus écrit dans les journaux.
- La base de données de Dojo n'est accessible que depuis Dojo.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
