# Maputnik als React-Komponente – POC

## Ergebnis und Ausgangspunkt

Maputnik kann ohne iframe als Child Component einer fremden React-Root betrieben werden. Der POC kapselt den bestehenden Editor; Layer-, Source-, Property-, Filter- und JSON-Editoren sowie RevisionStore und MapLibre werden wiederverwendet.

Basis: [maplibre/maputnik](https://github.com/maplibre/maputnik), Commit `d802049d029e37adfc75e1c8e6b4eecaf0a10ec9`, Maputnik 3.1.0. Fork: [deniial00/maputnik](https://github.com/deniial00/maputnik). Die POC-Änderungen gehören zum Branch `feature/embeddable-editor`; `main` bleibt der Upstream-Stand. Es wurden keine Pakete veröffentlicht. Das Upstream-Lockfile bleibt unverändert.

## Starten

Fork mit dem POC-Branch klonen und die Demo starten:

```sh
git clone --branch feature/embeddable-editor https://github.com/deniial00/maputnik.git
cd maputnik
npm ci
npm run start:embed
```

Die separate Host-Anwendung läuft unter `http://localhost:5173/`. Sie importiert `src/editor` als Quellcode, hat einen eigenen Einstiegspunkt, eine eigene React-Root und eine eigene Vite-Konfiguration. Ihre Abhängigkeiten kommen aus der Installation im Repository-Root; im Beispielordner ist kein weiteres `npm install` notwendig.

```sh
npm run build:embed         # Typecheck + Host-Produktionsbuild nach dist-embed/
npm run start              # ursprüngliche Web-App auf :8888/maputnik/
npm run build              # ursprünglicher Produktionsbuild nach dist/
npx playwright install chromium
npm run test -- e2e/embed.spec.ts --workers=2
npm run test-unit -- --run
npm run lint
npm run lint-css
```

Der Test-Runner startet beide Devserver automatisch oder verwendet bereits laufende Server. Der Embed-Test benötigt auch bei `E2E_NO_WEBSERVER=1` den Host auf Port 5173. Das Upstream-`.nvmrc` nennt Node 22.13; geprüft wurde hier mit Node 26.7.0, React 19.2.8, MapLibre GL 6.5.0 und Vite 8.2.2 aus dem vorhandenen Lockfile.

Die Demo verwendet absichtlich lokale illustrative GeoJSON-Geometrie. Es gibt keine Abhängigkeit von einer Basiskarte, einem API-Schlüssel oder einem Maputnik-Backend. „Snapshot speichern“ speichert eine Kopie im React-State des Hosts und zeigt sie als JSON. Dies ist keine dauerhafte Speicherung; nach einem Reload ist sie weg.

## Integration

```tsx
import { useRef, useState } from "react";
import {
  MaputnikEditor,
  type MaputnikEditorHandle,
  type StyleSpecification,
} from "./maputnik/src/editor";

export function StyleDesigner({ initialStyle }: { initialStyle: StyleSpecification }) {
  const editor = useRef<MaputnikEditorHandle>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<StyleSpecification>();

  return <>
    <button disabled={!dirty} onClick={() => {
      const style = editor.current?.getStyle();
      if (!style) return;
      setSaved(style); // Hier kann der Host seinen eigenen API-Aufruf ausführen.
      setDirty(false);
    }}>Speichern</button>
    <div style={{ height: 650 }}>
      <MaputnikEditor
        ref={editor}
        initialStyle={initialStyle}
        onStyleChange={() => setDirty(true)}
      />
    </div>
    {saved && <pre>{JSON.stringify(saved, null, 2)}</pre>}
  </>;
}
```

Der Import lädt die Editor-SCSS automatisch. Nicht zusätzlich `src/index.jsx` oder `src/styles/index.scss` importieren: Diese gehören zur Vollbild-Web-App. Der Host braucht eine definierte Höhe, empfohlen mindestens 600 px; für den bestehenden Desktop-Editor sind etwa 1000 px Breite sinnvoll. Die Komponente selbst hat eine Mindesthöhe von 400 px. Das Beispiel scrollt den Editor bei schmaleren Fenstern horizontal.

Für eine andere Vite-Anwendung müssen React/ReactDOM auf dieselbe Installation aufgelöst werden (`resolve.dedupe` im Beispiel). Sass, JSON-Importe, Vites `?worker&url` und Asset-Importe müssen unterstützt werden. `global: "globalThis"` wird wie im Upstream benötigt. Der vorhandene RTL-Plugin-Asset muss unter der `BASE_URL` bereitstehen; `copy-rtl-text-plugin` und die Demo-Konfiguration erledigen dies. Andere Bundler und React-Versionen sind nicht Bestandteil dieser Prüfung.

## API-Vertrag

| API | Verhalten |
|---|---|
| `initialStyle` | Vollständiger MapLibre-Style; wird beim Mount kopiert. Spätere Prop-Änderungen ersetzen das Dokument nicht. |
| `onStyleChange?: () => void` | Signal nach einer committed Style-Änderung, einschließlich Undo/Redo, `setStyle` und `reset`. Kein Signal für Initialisierung, reine Layer-Auswahl, Kartenbewegung oder identische Dokumente. |
| `getStyle()` | Synchrone, unabhängige tiefe Kopie des vollständigen Editor-Dokuments. Enthält auch unbekannte Metadaten, URLs und vom Editor bearbeitete Werte. |
| `setStyle(style)` | Kopiert und ersetzt das Dokument; setzt Auswahl, Quelldaten-Cache, Dateihandle und Undo-Historie zurück. Unmittelbar danach liefert `getStyle()` bereits das neue Dokument, auch vor dem React-Commit. Kartenposition wird aus dem neuen Style übernommen, fehlend auf `[0,0]` / Zoom `0` gesetzt. |
| `reset()` | Wie `setStyle`, aber mit dem beim Mount gespeicherten ursprünglichen Style. `setStyle` ändert diese Reset-Basis nicht. |
| `className`, `style` | Optionale Attribute für den äußeren Container. Kein umfassendes Theming. |

`StyleSpecification` kommt direkt aus `@maplibre/maplibre-gl-style-spec`. Kein vollständig controlled Pattern, keine permanente Rückkopplung vom Host-Style in den Editor. Ref-Methoden erst nach dem Mount aufrufen; nach dem Unmount ist die Ref `null`.

`getStyle()` liest absichtlich das Editor-Dokument, nicht `map.getStyle()`: Die Karte kann vorübergehend einen für die Vorschau bereinigten Style oder einen Inspect-Style enthalten. Maputnik zeigt Validierungsfehler wie bisher an. Der Host muss vor dauerhafter Speicherung bei Bedarf selbst validieren; die API verspricht keine ausschließlich gültigen Dokumente.

### Warum ein Änderungssignal?

Kein zusätzliches vollständiges Style-JSON pro Callback. Tiefe Kopien entstehen an den API-Grenzen (`initialStyle`, `setStyle`, `getStyle`). Die vorhandene Style-Validierung, MapLibre-Diffing, History und ein Gleichheitsvergleich bleiben bestehen. Dies ist keine Aussage über konstante Laufzeit oder geringe Speichernutzung bei riesigen Styles. Ein Lasttest mit realen großen Styles gehört in Phase 2. Mehrere Änderungen in einem React-Batch können mehrere Signale auslösen; der Host sollte das Signal als Dirty-Markierung verwenden, nicht als Event-Sourcing-Protokoll.

## Architektur und Kopplungen

```text
Externer React-Host
  └── MaputnikEditor: öffentliche Ref + initialer Snapshot + CSS/Sprach-Scope
       └── App (embedded)
            ├── vorhandener Style-State + RevisionStore
            ├── vorhandene Layer-/Source-/Property-/Filter-/JSON-UI
            └── eigene MapLibre-Karte + ResizeObserver

src/index.jsx → App (normal) → vorhandener StyleStore / URL / Desktop-Modus
```

`App.tsx` ist weiter der interne Editor-Kern. Seine Extraktion in viele neue Module wurde bewusst vermieden. Ein internes `embedded`-Flag schaltet nur App-Integrationen ab. Die ursprüngliche Web-App muss im POC noch nicht Consumer der neuen öffentlichen Komponente werden.

| Bereich | Upstream-Kopplung | Anpassung im POC / verbleibende Grenze |
|---|---|---|
| Persistenz | `createStyleStore` lädt Browser-Storage oder Desktop-API. `StyleStore` greift direkt auf LocalStorage zu. | Im Embed-Modus wird die Factory nie ausgeführt; `saveStyle` persistiert dort nicht. Kein Memory-Store als Storage-Ersatz nötig. |
| URL / History | `App` liest/schreibt Suchparameter; MapLibre schreibt den Hash. | Beide Integrationen im Embed-Modus deaktiviert. Host-Routing bleibt unverändert. |
| Tastatur | Anonymer Body-Keyup im Konstruktor; globaler Keydown. | Registrierung nach Mount, Removal beim Unmount, Shortcut-Scope auf Editor begrenzt. Host-Inputs behalten Undo; Eingabefelder und CodeMirror nutzen ihr eigenes Undo. |
| CSS | Globale Resets, `html`/`body`, Vollbild-Layout und fixe Toolbar. | SCSS unter `.maputnik-editor` kompiliert; Toolbar/Hauptfläche relativ zum Container. Kein `body { overflow: hidden }` im Host. |
| Dialoge | Portals unter `body`, globales Scroll-Lock. | Vorhandenes AriaModal rendert in einen Slot im Editor; kein Body-Scroll-Lock. Dialog-Fokusfalle bleibt absichtlich aktiv. Nur ein Editor unterstützt. |
| Sprache | Globaler i18next-Detector mit Storage-Cache; `body.dir` im Render. | Eigene i18next-Instanz ohne Detector/Storage; Sprache initial Englisch und über bestehende Toolbar umstellbar. Richtung am Editor-Layout, nicht am Host-Body. |
| Karte | Eigene MapLibre-Instanz, bisher ohne `remove()`. | Map wird beim Unmount entfernt, ResizeObserver getrennt, Popup-React-Root freigegeben und Sprachlistener/Inspector-Timer bereinigt. |
| Inspector | `maplibre-gl-inspect` 1.9.0 hat einen privaten, nicht abbrechbaren Timeout. | Instanzlokaler Render-Guard verhindert Zugriff auf entfernte Karten. Der kurze interne Timeout läuft noch aus; ein vollständiger Fix wäre upstream nötig. |
| CodeMirror / Farbe | Fehlendes `destroy()`, throttled Farb-Callback. | CodeMirror wird zerstört und Farb-Callback abgebrochen. Farbpicker-Koordinaten beziehen sich im Embed-Modus auf den Container. |
| Quellen-Metadaten | Asynchrone Fetches und LayerWatcher-Throttle. | Abbruchsignal bei Style-Ersatz und Unmount für eigene HTTP-Fetches; veraltete Ergebnisse werden ignoriert; Watcher wird geleert/abgebrochen. PMTiles-/Inspector-interne Requests sind nicht vollständig von uns abbrechbar. |
| Import / Export | File-Picker, Download, optionale öffentliche Style-URLs. | Bestehende Funktionen bleiben erhalten; Browser-APIs werden nach Benutzeraktion verwendet. Host-Speichern erfolgt unabhängig per Ref. |
| OpenLayers | Alternativer Renderer über Style-Metadaten. | Weiter vorhanden, grundlegendes Disposal ergänzt. POC-Akzeptanz und Demo fokussieren MapLibre; OpenLayers ist nicht umfassend qualifiziert. |

### Verbleibende globale Abhängigkeiten

Die SVG-Farbfilter der eigenständigen HTML-Shell werden im Embed-Einstieg mit eigenen IDs mitgeliefert.

Kein Shadow DOM: Aggressive globale Host-CSS-Regeln können weiterhin in den Editor hineinwirken. Vendor-CSS von MapLibre, Geocoder und OpenLayers ist weiterhin anhand seiner Herstellerklassen global; Hosts mit weiteren Karten derselben Bibliotheken müssen Konflikte prüfen. Roboto-Font-Faces bleiben global registriert. Autocomplete-Menüs verwenden teilweise weiterhin die Fensterhöhe, sodass sie an Containergrenzen abgeschnitten werden können.

MapLibre-Worker-URL, RTL-Plugin und PMTiles-Protokoll werden weiterhin auf Modulebene bzw. beim Karten-Mount registriert. Das ist ein bewusster Rest der Upstream-Architektur; Hosts mit eigener MapLibre-Konfiguration benötigen eine weitere Entkopplung. Ein benötigtes `window.Buffer`-Polyfill wird nur ergänzt, wenn es nicht bereits existiert. Der Source-Import ist browsergebunden und nicht SSR-sicher.

### Externe Ressourcen

`sources`, `sprite`, `glyphs`, `layers` und `metadata` werden nicht durch ein eigenes Datenmodell ersetzt. Die Karte lädt Quellen, Sprites und Glyphen selbst; es gibt keinen neuen Proxy und keinen Maputnik-Backend-Zwang. CORS, CSP, Erreichbarkeit und erforderliche Tokens bleiben Verantwortung des Hosts bzw. Ressourcenanbieters. Relative Ressourcen-URLs werden im Kontext des Host-Ursprungs aufgelöst. Die vorhandene Maputnik-Token-Ersetzung bleibt aktiv.

Der URL-GeoJSON-Pfad wird mit echtem MapLibre und einer abgefangenen HTTP-Antwort getestet. Live-Drittanbieter, PMTiles-Archive und vollständige Sprite-/Glyphen-Renderkombinationen sind nicht umfassend getestet. Multi-Sprite-Styles werden an MapLibre weitergereicht; die vorhandene Icon-Metadaten-Vorschlagsliste unterstützt im POC nur den einfachen String-Sprite.

## Tests und Akzeptanz

Die automatischen Embed-Tests liegen in `e2e/embed.spec.ts`, der zugehörige Driver in `e2e/embed-driver.ts`. Das kleine API-Fixture unter `examples/react-embed/tests` wird nur vom Devserver geladen und ist nicht Teil des Produktionsbuilds. Es verwendet denselben echten Editor, kein UI-Mock. Jeder Embed-Test läuft mit werfenden LocalStorage- und SessionStorage-Gettern; ungefangene Browserfehler werden mitgeprüft.

| Kriterium | Nachweis |
|---|---|
| AC1 Mounting | Fremde React-Root, kein iframe, React StrictMode |
| AC2 Initial Style | Vollständiger initialer Style, korrekte Startposition |
| AC3 Editor | Paint/Layout, Layer hinzufügen/auswählen, Sources-Dialog, MapLibre-Style-Update und Undo |
| AC4 Auslesen | Snapshot inklusive Metadaten/Quellen; Mutationen an Rückgabewerten isoliert |
| AC5 Änderung | Dirty-Signal, aktueller Callback, identische Dokumente ohne Signal |
| AC6 Ersetzen | `setStyle` unmittelbar lesbar, neue History-Basis, `reset` zur Mount-Basis |
| AC7 Backend | Lokale Demo ohne Backend; externe GeoJSON-Quelle über MapLibre |
| AC8 Persistenz | Tests mit nicht verfügbarem Storage; kein Storage-Fallback erforderlich |
| AC9 Bestehende App | Eigener Produktionsbuild und vorhandene Regressionstests |

Die abschließenden ausgeführten Checks und verbleibenden Einschränkungen stehen in [verification.md](verification.md).

## Bewertung und Phase 2

| Kriterium | Bewertung | Begründung |
|---|---|---|
| Aufwand für initiale Extraktion | mittel | Style-/UI-Kern gut wiederverwendbar; Lifecycle und globale Effekte erfordern mehrere gezielte Änderungen. |
| Änderungen an Maputnik | mittel | Keine zweite UI, aber App, Karte, Dialoge und einzelne Eingabekomponenten berührt. |
| Upstream-Mergefähigkeit | mittel | Kleine, lokalisierte Anpassungen; zentraler `App`-Code bleibt ein Konfliktpunkt. |
| Globale Abhängigkeiten | mittel | URL/Storage/Body isoliert; Worker/Protokoll/Vendor-CSS/Polyfill bleiben. |
| React-Integration | gut | Uncontrolled API, stabile Ref, Snapshot-Grenzen, StrictMode-Tests. |
| API-Komplexität | gering | Ein Initial-Prop, ein Signal, drei Methoden. |
| Wartbarkeit des Forks | mittel | POC überschaubar; globale Initialisierung und privater MapLibre-/Inspector-Zugriff bleiben Risiken. |

**Empfehlung: Phase 2 ist technisch sinnvoll**, wenn das Ziel eine einzelne, browserbasierte Desktop-Einbettung ist. Vor einer produktiven Library sollten App-Integrationen als Adapter extrahiert, Karten-Globals konfigurierbar gemacht, Portal/CSS-Isolation vervollständigt und ein Library-Build mit Peer Dependencies, Typdeklarationen und explizitem CSS-/Worker-Export ergänzt werden. Danach folgen große reale Styles, Host-Router, eigene Host-i18n, strenge CSP, Resize-Szenarien und Browser-Matrix. Multi-Editor, SSR, vollständiges Theming und eine externe Karteninstanz bleiben eigene Arbeitspakete.
