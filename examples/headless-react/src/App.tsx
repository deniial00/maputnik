import { useEffect, useMemo, useState } from "react";
import {
  createHeadlessEditor, EditorProvider, HeadlessLayerEditor, HeadlessLayerList,
  HeadlessMapPreview, MaputnikUIRoot, useDirty, useEditorActions, useHistory,
  useSelectedLayer, useStyle, useValidation,
} from "../../../src/headless/all";
import { bootstrapStyle, fetchStyle, listStyles, updateStyle, type StyleSummary } from "./repository";

type ProductSection = "projects" | "workspace" | "publishing";

export function App() {
  const editor = useMemo(() => createHeadlessEditor({initialStyle: bootstrapStyle, maxHistory: 75}), []);
  return <EditorProvider editor={editor}><HeadlessWorkbench /></EditorProvider>;
}

function HeadlessWorkbench() {
  const editor = useEditorActions();
  const style = useStyle();
  const selectedLayer = useSelectedLayer();
  const dirty = useDirty();
  const history = useHistory();
  const validation = useValidation();
  const [library, setLibrary] = useState<StyleSummary[]>([]);
  const [activeId, setActiveId] = useState("vienna-day");
  const [status, setStatus] = useState("Loading style library…");
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<ProductSection>("workspace");

  useEffect(() => {
    let active = true;
    void Promise.all([listStyles(), fetchStyle("vienna-day")]).then(([items, initial]) => {
      if (!active) return;
      setLibrary(items);
      editor.loadStyle(initial);
      setStatus("Ready · repository adapter loaded the initial style");
    });
    return () => { active = false; };
  }, [editor]);

  async function openStyle(id: string) {
    setBusy(true);
    setStatus("Fetching style…");
    try {
      editor.loadStyle(await fetchStyle(id));
      setActiveId(id);
      setStatus("Style loaded · history reset to a clean baseline");
    } finally {
      setBusy(false);
    }
  }

  async function saveStyle() {
    setBusy(true);
    setStatus("Updating style…");
    try {
      await updateStyle(activeId, editor.getStyle());
      editor.markClean();
      setStatus(`Saved ${style.name} through the host repository adapter`);
    } finally {
      setBusy(false);
    }
  }

  return <main className="headless-host">
    <header className="product-header">
      <div><span className="product-mark">M</span><strong>Atlas Studio</strong><small>Headless Maputnik draft</small></div>
      <nav aria-label="Product navigation">
        <button data-wd-key="headless:nav:projects" className={section === "projects" ? "active" : undefined}
          aria-current={section === "projects" ? "page" : undefined} onClick={() => setSection("projects")}>Projects</button>
        <button data-wd-key="headless:nav:workspace" className={section === "workspace" ? "active" : undefined}
          aria-current={section === "workspace" ? "page" : undefined} onClick={() => setSection("workspace")}>Style workspace</button>
        <button data-wd-key="headless:nav:publishing" className={section === "publishing" ? "active" : undefined}
          aria-current={section === "publishing" ? "page" : undefined} onClick={() => setSection("publishing")}>Publishing</button>
      </nav>
      <span className="host-owned">Host-owned product shell</span>
    </header>

    {section !== "workspace" && <ProductPlaceholder section={section} onOpenWorkspace={() => setSection("workspace")} />}

    <div className={section === "workspace" ? "workspace-view" : "workspace-view is-hidden"}>
      <section className="workspace-heading">
        <div><p className="eyebrow">STYLE LIBRARY / {activeId.toUpperCase()}</p><h1>{style.name}</h1>
          <p>Maputnik's editing model and selected components inside a custom application.</p></div>
        <div className="document-actions">
          <span className={dirty ? "dirty-pill is-dirty" : "dirty-pill"} data-wd-key="headless:dirty">{dirty ? "Unsaved changes" : "Saved"}</span>
          <button data-wd-key="headless:undo" disabled={!history.canUndo || busy} onClick={() => editor.undo()}>Undo</button>
          <button data-wd-key="headless:redo" disabled={!history.canRedo || busy} onClick={() => editor.redo()}>Redo</button>
          <button className="primary" data-wd-key="headless:save" disabled={!dirty || busy} onClick={() => void saveStyle()}>Save style</button>
        </div>
      </section>

      <div className="product-grid">
        <aside className="library-panel">
          <div className="panel-title"><span>Style library</span><small>{library.length} entries</small></div>
          {library.map(item => <button key={item.id} data-wd-key={`headless:library:${item.id}`}
            className={item.id === activeId ? "library-card selected" : "library-card"}
            disabled={busy} onClick={() => void openStyle(item.id)}>
            <span className={`style-swatch ${item.id}`} /><span><strong>{item.name}</strong><small>{item.description}</small></span>
          </button>)}
          <div className="core-contract"><strong>Headless boundary</strong><code>fetchStyle(id)</code><code>updateStyle(id, style)</code><code>editor.markClean()</code></div>
        </aside>

        <section className="editor-card">
          <div className="editor-card-bar"><span>Composable editor workspace</span>
            <span data-wd-key="headless:selected">Selected: {selectedLayer?.id ?? "none"}</span></div>
          <MaputnikUIRoot>
            <div className="headless-panes">
              <div className="headless-layer-list"><HeadlessLayerList /></div>
              <div className="headless-layer-editor"><HeadlessLayerEditor /></div>
              <div className="headless-map"><HeadlessMapPreview transformStyle={value => value} /></div>
            </div>
          </MaputnikUIRoot>
        </section>
      </div>

      <footer className="status-bar">
        <span role="status" data-wd-key="headless:status">{status}</span>
        <span data-wd-key="headless:history">History {history.index + 1}/{history.length}</span>
        <span data-wd-key="headless:validation">{validation.length} validation issues</span>
      </footer>
    </div>
  </main>;
}

function ProductPlaceholder({section, onOpenWorkspace}: {section: Exclude<ProductSection, "workspace">; onOpenWorkspace(): void}) {
  const projectView = section === "projects";
  return <section className="product-placeholder" data-wd-key="headless:product-view">
    <p className="eyebrow">HOST-OWNED PRODUCT AREA</p>
    <h1>{projectView ? "Projects" : "Publishing"}</h1>
    <p>{projectView
      ? "Project selection, permissions, and organization belong to the host application."
      : "Release channels, validation gates, and deployment workflows remain host concerns."}</p>
    <div className="placeholder-card">
      <strong>{projectView ? "Vienna mobility atlas" : "Draft release"}</strong>
      <span>{projectView ? "2 styles · last edited just now" : "Current style remains in the editor store while you navigate."}</span>
      <button data-wd-key="headless:open-workspace" onClick={onOpenWorkspace}>Open style workspace</button>
    </div>
  </section>;
}
