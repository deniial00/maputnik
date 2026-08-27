import { useRef, useState } from "react";
import { MaputnikEditor, type MaputnikEditorHandle, type StyleSpecification } from "../../../src/editor";
import { initialStyle, anotherStyle } from "./styles";

export function App() {
  const editor = useRef<MaputnikEditorHandle>(null);
  const [dirty, setDirty] = useState(false);
  const [changes, setChanges] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [snapshot, setSnapshot] = useState<StyleSpecification | null>(null);
  const [message, setMessage] = useState("Ready. Select a layer and edit its properties.");

  function readStyle(save: boolean) {
    const value = editor.current?.getStyle();
    if (!value) return;
    setSnapshot(value);
    if (save) setDirty(false);
    setMessage(save ? "Snapshot saved in the host application. No server request." : "Complete style read using getStyle().");
  }

  return <main className="embed-host">
    <header className="host-header">
      <div className="host-brand"><span className="host-mark">M</span><span>MAPUTNIK <small>INTEGRATION LAB</small></span></div>
      <span className="host-badge">React component · POC</span>
    </header>
    <section className="host-intro">
      <div><p className="host-eyebrow">01 / EMBEDDABLE EDITOR</p><h1>One editor. Your application.</h1>
        <p>Real Maputnik, directly in your React tree. The editor owns state; the host handles saving.</p></div>
      <div className="host-contract"><code>&lt;MaputnikEditor ref=&#123;editor&#125; /&gt;</code><span>No iframe · No required backend · No LocalStorage</span></div>
    </section>
    <section className="host-workspace" aria-label="Editor workspace">
      <div className="host-actions">
        <div className="host-status"><span className={dirty ? "status-dot dirty" : "status-dot"} />
          <strong data-wd-key="host:dirty">{dirty ? "Unsaved changes" : "No unsaved changes"}</strong>
          <span data-wd-key="host:changes">{changes} signals</span></div>
        <div className="host-buttons">
          <button data-wd-key="host:replace" disabled={!mounted} onClick={() => editor.current?.setStyle(anotherStyle)}>Load another style</button>
          <button data-wd-key="host:reset" disabled={!mounted} onClick={() => editor.current?.reset()}>Reset</button>
          <button data-wd-key="host:read" disabled={!mounted} onClick={() => readStyle(false)}>Read style</button>
          <button className="host-primary" data-wd-key="host:save" disabled={!mounted || !dirty} onClick={() => readStyle(true)}>Save snapshot ↗</button>
        </div>
      </div>
      <div className="host-editor-slot">
        {mounted ? <MaputnikEditor ref={editor} initialStyle={initialStyle} onStyleChange={() => {
          setDirty(true);
          setChanges(count => count + 1);
        }} /> : <div className="host-empty">Editor unmounted. The host application is still running.</div>}
      </div>
      <div className="host-footnote"><span>Local GeoJSON demo data · illustrative geometry, no basemap</span>
        <button data-wd-key="host:mount" onClick={() => {
          setMounted(value => !value);
          setDirty(false);
          setChanges(0);
        }}>{mounted ? "Hide editor" : "Show editor"}</button></div>
    </section>
    <section className="host-output">
      <div><p className="host-eyebrow">02 / HOST STATE</p><h2>Style snapshot</h2><p role="status">{message}</p></div>
      <div className="host-probe"><label htmlFor="host-note">Host input · independent of the editor</label><input id="host-note" data-wd-key="host:input" placeholder="Keyboard and layout remain under host control." /></div>
      <pre data-wd-key="host:snapshot">{snapshot ? JSON.stringify(snapshot, null, 2) : "// No snapshot yet. Click \"Read style\"."}</pre>
    </section>
    <footer className="host-footer"><span>Maputnik / Embeddable React POC</span><span>Uncontrolled state · Imperative API · React StrictMode</span></footer>
  </main>;
}
