import { useRef, useState } from "react";
import { MaputnikEditor, type MaputnikEditorHandle, type StyleSpecification } from "../../../src/editor";
import { initialStyle, anotherStyle } from "./styles";

export function App() {
  const editor = useRef<MaputnikEditorHandle>(null);
  const [dirty, setDirty] = useState(false);
  const [changes, setChanges] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [snapshot, setSnapshot] = useState<StyleSpecification | null>(null);
  const [message, setMessage] = useState("Bereit. Wähle einen Layer und ändere seine Eigenschaften.");

  function readStyle(save: boolean) {
    const value = editor.current?.getStyle();
    if (!value) return;
    setSnapshot(value);
    if (save) setDirty(false);
    setMessage(save ? "Snapshot in der Host-Anwendung gespeichert. Kein Serveraufruf." : "Vollständigen Style über getStyle() ausgelesen.");
  }

  return <main className="embed-host">
    <header className="host-header">
      <div className="host-brand"><span className="host-mark">M</span><span>MAPUTNIK <small>INTEGRATION LAB</small></span></div>
      <span className="host-badge">React component · POC</span>
    </header>
    <section className="host-intro">
      <div><p className="host-eyebrow">01 / EMBEDDABLE EDITOR</p><h1>Ein Editor. Deine Anwendung.</h1>
        <p>Echter Maputnik, direkt im React-Baum. State im Editor, Speichern im Host.</p></div>
      <div className="host-contract"><code>&lt;MaputnikEditor ref=&#123;editor&#125; /&gt;</code><span>Ohne iframe · Ohne Pflicht-Backend · Ohne LocalStorage</span></div>
    </section>
    <section className="host-workspace" aria-label="Editor-Arbeitsbereich">
      <div className="host-actions">
        <div className="host-status"><span className={dirty ? "status-dot dirty" : "status-dot"} />
          <strong data-wd-key="host:dirty">{dirty ? "Ungespeicherte Änderungen" : "Keine offenen Änderungen"}</strong>
          <span data-wd-key="host:changes">{changes} Signale</span></div>
        <div className="host-buttons">
          <button data-wd-key="host:replace" disabled={!mounted} onClick={() => editor.current?.setStyle(anotherStyle)}>Anderen Style laden</button>
          <button data-wd-key="host:reset" disabled={!mounted} onClick={() => editor.current?.reset()}>Zurücksetzen</button>
          <button data-wd-key="host:read" disabled={!mounted} onClick={() => readStyle(false)}>Style auslesen</button>
          <button className="host-primary" data-wd-key="host:save" disabled={!mounted || !dirty} onClick={() => readStyle(true)}>Snapshot speichern ↗</button>
        </div>
      </div>
      <div className="host-editor-slot">
        {mounted ? <MaputnikEditor ref={editor} initialStyle={initialStyle} onStyleChange={() => {
          setDirty(true);
          setChanges(count => count + 1);
        }} /> : <div className="host-empty">Editor entfernt. Die Host-Anwendung läuft weiter.</div>}
      </div>
      <div className="host-footnote"><span>Lokale GeoJSON-Demodaten · illustrative Geometrie, keine Basiskarte</span>
        <button data-wd-key="host:mount" onClick={() => {
          setMounted(value => !value);
          setDirty(false);
          setChanges(0);
        }}>{mounted ? "Editor ausblenden" : "Editor einblenden"}</button></div>
    </section>
    <section className="host-output">
      <div><p className="host-eyebrow">02 / HOST STATE</p><h2>Style-Snapshot</h2><p role="status">{message}</p></div>
      <div className="host-probe"><label htmlFor="host-note">Host-Eingabe · unabhängig vom Editor</label><input id="host-note" data-wd-key="host:input" placeholder="Hier bleiben Tastatur und Layout beim Host." /></div>
      <pre data-wd-key="host:snapshot">{snapshot ? JSON.stringify(snapshot, null, 2) : "// Noch kein Snapshot. Klicke auf „Style auslesen“."}</pre>
    </section>
    <footer className="host-footer"><span>Maputnik / Embeddable React POC</span><span>Uncontrolled state · Imperative API · React StrictMode</span></footer>
  </main>;
}
