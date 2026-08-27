# POC-Prüfbericht

Prüfdatum: 27. August 2026. Umgebung: macOS ARM64, Node 26.7.0, Chromium 151 / Playwright 1.62.1. Upstream-Basis: `d802049d029e37adfc75e1c8e6b4eecaf0a10ec9`. Lokaler Branch: `feature/embeddable-editor`.

## Durchgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm ci` | Installation aus dem unveränderten Upstream-Lockfile erfolgreich |
| `npm run build` | Typecheck und ursprünglicher Web-App-Build erfolgreich |
| `npm run build:embed` | Typecheck und Produktionsbuild des unabhängigen React-Hosts erfolgreich |
| `npm run lint` | Erfolgreich |
| `npm run lint-css` | Erfolgreich |
| `npx stylelint src/editor/editor.scss` | Erfolgreich |
| `npm run test-unit -- --run` | 50 Tests in 9 Dateien bestanden |
| Gemeinsamer Browserlauf | 136 Tests bestanden: damals 16 Embed-Tests plus 120 bestehende Regressionstests |
| Gezielter Abschlusslauf nach zusätzlicher Quellenabsicherung | 25 Tests bestanden: 17 Embed-, 6 Karten- und 2 History-Tests |
| API-Test-Fixture Typecheck | Separat gegen die Projekt-Compileroptionen erfolgreich |
| Negative Test-Gegenprobe | Initial-Style-Erwartung absichtlich verfälscht: Test scheitert am falschen Namen. Danach Originaldatei wiederhergestellt und erneut positive Tests ausgeführt. |
| `git diff --check` | Erfolgreich |
| Sichtprüfung im Codex-Browser | Echter Editor im Host, Paint-Änderung, Style-Wechsel, Source-Dialog, Layout-Sichtbarkeit und Übernahme der SVG-Farbfilter geprüft |

Insgesamt wurden **17 neue Embed-Tests und 120 unterschiedliche bestehende Browsertests** erfolgreich ausgeführt. Die komplette übrige Upstream-E2E-Suite wurde nicht ausgeführt. Die 120 vorhandenen Tests stammen aus:

```text
e2e/map.spec.ts
e2e/history.spec.ts
e2e/keyboard.spec.ts
e2e/layer-editor.spec.ts
e2e/modals.spec.ts
e2e/i18n.spec.ts
```

Reproduzierbarer gemeinsamer Lauf auf dem fertigen Stand (nun 137 Tests):

```sh
npm run test -- e2e/embed.spec.ts e2e/map.spec.ts e2e/history.spec.ts \
  e2e/keyboard.spec.ts e2e/layer-editor.spec.ts e2e/modals.spec.ts \
  e2e/i18n.spec.ts --workers=3
```

Alle Embed-Tests verwenden den echten Editor mit React StrictMode, eine echte MapLibre-Karte und nicht verfügbarem LocalStorage/SessionStorage. Ungefangene Browserfehler lassen den jeweiligen Test scheitern. Der Lifecycle-Test wartet auch den privaten Inspector-Timeout ab. Der zusätzliche Quellen-Test liefert Metadaten verzögert aus und ersetzt währenddessen das Dokument.

## Während der Umsetzung gefundene und behobene Probleme

- Body-Keyup wurde im Konstruktor registriert und nicht entfernt.
- MapLibre-Instanz, Popup-React-Root und Sprachlistener hatten kein vollständiges Cleanup.
- CodeMirror wurde beim Unmount nicht zerstört; StrictMode erzeugte doppelte Editoren.
- Ein privater Inspector-Timeout versuchte nach Unmount `setStyle()` auf einer nicht mehr existierenden Karte aufzurufen. Der instanzlokale Guard verhindert dies.
- Veraltete Quellenabfragen konnten nach einem Style-Wechsel auf das neue Quellenverzeichnis zugreifen. Abbruchsignale, eingefrorener Abfrage-Snapshot und Ergebnis-Guards verhindern das.
- Die globale i18next-Initialisierung wurde durch einen Toolbar-Import mitgeladen. Sprachkonfiguration und eingebettete Instanz sind jetzt getrennt.
- CSS-Vollbildpositionierung, Body-Scroll-Lock und Portals außerhalb des Editors verhinderten eine saubere Host-Einbettung.

## Build- und Sicherheitsmeldungen

Vite warnt weiterhin vor großen Bundles. Der Host-Build enthält den bestehenden Editor inklusive OpenLayers und liegt beim Haupt-JavaScript bei ungefähr **3,43 MB unkomprimiert / 955 KB gzip**, zuzüglich Worker, CSS und Fonts. Dies ist ein POC-Source-Build, keine optimierte Library-Ausgabe. Der zusätzliche Buildordner liegt außerhalb der Beispiel-Root; Vite leert ihn absichtlich nicht automatisch. Für einen Deployment-Artefaktbau ist ein sauberes Buildverzeichnis zu verwenden.

`npm audit --json` meldete im bestehenden Lockfile **6 betroffene Abhängigkeiten: 1 niedrig, 4 mittel, 1 hoch**. Gemeldet wurden `@babel/core`, `ajv`, `istanbul-lib-processinfo`, `js-yaml`, `qs` und das transitiv verwendete `uuid`. Der hohe Befund betrifft `js-yaml`. Kein `npm audit fix` und keine Paket-Upgrades wurden ausgeführt, um Upstream- und POC-Änderungen nicht zu vermischen. Vor einem Produktionseinsatz ist eine gesonderte Abhängigkeitsprüfung und Aktualisierung erforderlich. Dies ist kein vollständiges Security-Audit.

## Nicht durch diese Prüfung abgedeckt

Desktop-/Backend-Modus, Safari/Firefox, React-Versionen außerhalb des installierten Upstreams, SSR, Multi-Editor, produktives Host-Backend, Authentifizierung, beliebige CSP-Regeln, große reale Styles, Live-Drittanbieter, vollständige Sprite-/Glyphen-/PMTiles-Kombinationen und umfassende OpenLayers-Kompatibilität.

Globale MapLibre-Initialisierung, Hersteller-CSS und ein kleiner privater Inspector-Timeout bleiben bekannte Kopplungen. Details und Phase-2-Empfehlung: [Integrationsanleitung und Architekturbericht](embeddable-editor.md).

## Übergabe

Der GitHub-Fork ist [deniial00/maputnik](https://github.com/deniial00/maputnik), der POC-Branch heißt `feature/embeddable-editor`. Die ursprüngliche Quelle bleibt lokal als Remote `origin` erhalten; der persönliche Fork ist als Remote `fork` eingerichtet. Es wurde kein Pull Request an Upstream eröffnet und kein Paket veröffentlicht. Der zusätzliche Patch der lokalen Übergabe enthält Änderungen und neue Dateien; er kann auf der genannten Upstream-Basis mit `git apply` übernommen werden.
