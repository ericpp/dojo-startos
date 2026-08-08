import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.29.2:4',
  releaseNotes: {
    en_US: `Fixes an update that could not complete.

Updating from 1.29.2:2 stopped with an "Invalid input" error: the update re-ran the settings migration from the previous release, which could not read a settings file it had already converted. It now leaves an already-converted file alone. Nothing had been written when the error appeared, so a failed update left your settings untouched — simply update again.

On installs carried over from StartOS 0.3.5.1, the same re-run could quietly put your pre-0.4 settings back over your current ones. If your Bitcoin node, indexer, payment code or PandoTx settings changed on their own, set them again.

This release also carries 1.29.2:3, in case you were never able to install it: Dojo now requires the current revision of whichever Bitcoin version line you are on, so an out-of-date Bitcoin is reported as needing an update instead of opening an Auto-Configure form that could not be submitted.`,
    es_ES: `Corrige una actualización que no podía completarse.

Al actualizar desde 1.29.2:2, el proceso se detenía con un error «Invalid input»: la actualización volvía a ejecutar la migración de ajustes de la versión anterior, que no podía leer un archivo de ajustes que ella misma ya había convertido. Ahora respeta un archivo ya convertido y no lo toca. No se había escrito nada cuando aparecía el error, así que una actualización fallida dejó tus ajustes intactos: basta con volver a actualizar.

En instalaciones que vienen de StartOS 0.3.5.1, esa misma repetición podía reponer silenciosamente tus ajustes anteriores a 0.4 sobre los actuales. Si tu nodo Bitcoin, tu indexador, tu código de pago o tus ajustes de PandoTx cambiaron por sí solos, vuelve a configurarlos.

Esta versión también incluye la 1.29.2:3, por si nunca pudiste instalarla: Dojo ahora exige la revisión actual de la línea de versiones de Bitcoin que uses, de modo que un Bitcoin desactualizado se señala como pendiente de actualizar en lugar de abrir un formulario de Auto-Configurar que no se podía enviar.`,
    de_DE: `Behebt ein Update, das nicht abgeschlossen werden konnte.

Ein Update von 1.29.2:2 brach mit dem Fehler „Invalid input“ ab: Dabei wurde die Einstellungs-Migration der vorherigen Ausgabe erneut ausgeführt, die eine bereits von ihr umgewandelte Einstellungsdatei nicht lesen konnte. Sie lässt eine bereits umgewandelte Datei jetzt unangetastet. Als der Fehler auftrat, war noch nichts geschrieben worden — ein fehlgeschlagenes Update hat deine Einstellungen also unverändert gelassen; führe das Update einfach erneut aus.

Bei Installationen, die von StartOS 0.3.5.1 übernommen wurden, konnte derselbe erneute Lauf deine Einstellungen von vor 0.4 unbemerkt über die aktuellen legen. Falls sich dein Bitcoin-Knoten, dein Indexer, dein Zahlungscode oder deine PandoTx-Einstellungen von selbst geändert haben, stelle sie erneut ein.

Diese Ausgabe enthält außerdem 1.29.2:3, falls du sie nie installieren konntest: Dojo verlangt jetzt die aktuelle Revision der von dir genutzten Bitcoin-Versionsreihe, sodass ein veraltetes Bitcoin als aktualisierungsbedürftig gemeldet wird, statt ein Formular „Auto-Konfiguration“ zu öffnen, das sich nicht absenden ließ.`,
    pl_PL: `Naprawia aktualizację, której nie dało się ukończyć.

Aktualizacja z 1.29.2:2 przerywała się błędem „Invalid input”: ponownie uruchamiała migrację ustawień z poprzedniego wydania, która nie potrafiła odczytać pliku ustawień już przez siebie przekształconego. Teraz pozostawia przekształcony plik bez zmian. W chwili pojawienia się błędu nic nie zostało jeszcze zapisane, więc nieudana aktualizacja nie naruszyła Twoich ustawień — wystarczy zaktualizować ponownie.

W instalacjach przeniesionych ze StartOS 0.3.5.1 to samo ponowne uruchomienie mogło po cichu przywrócić ustawienia sprzed 0.4 na miejsce bieżących. Jeśli Twój węzeł Bitcoin, indekser, kod płatności lub ustawienia PandoTx zmieniły się same, ustaw je ponownie.

To wydanie zawiera także 1.29.2:3, na wypadek gdyby nie dało się jej zainstalować: Dojo wymaga teraz bieżącej rewizji tej linii wydań Bitcoina, z której korzystasz, więc nieaktualny Bitcoin jest zgłaszany jako wymagający aktualizacji zamiast otwierać formularz Auto-Konfiguracji, którego nie dało się wysłać.`,
    fr_FR: `Corrige une mise à jour qui ne pouvait pas aboutir.

La mise à jour depuis la 1.29.2:2 s'arrêtait sur une erreur « Invalid input » : elle rejouait la migration des réglages de la version précédente, incapable de relire un fichier de réglages qu'elle avait déjà converti. Elle laisse désormais intact un fichier déjà converti. Rien n'avait été écrit au moment de l'erreur : une mise à jour échouée a donc laissé vos réglages intacts — il suffit de relancer la mise à jour.

Sur les installations reprises de StartOS 0.3.5.1, ce même rejeu pouvait discrètement remettre vos réglages d'avant la 0.4 par-dessus les actuels. Si votre nœud Bitcoin, votre indexeur, votre code de paiement ou vos réglages PandoTx ont changé d'eux-mêmes, redéfinissez-les.

Cette version reprend également la 1.29.2:3, si vous n'avez jamais pu l'installer : Dojo exige maintenant la révision actuelle de la ligne de versions de Bitcoin que vous utilisez, de sorte qu'un Bitcoin obsolète est signalé comme devant être mis à jour au lieu d'ouvrir un formulaire Auto-Configuration impossible à envoyer.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
