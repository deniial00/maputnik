import { MdCheck, MdCode, MdRedo, MdSave, MdUndo } from "react-icons/md";
import { AppLayout } from "../../../src/components/AppLayout";
import {
  HeadlessLayerEditor, HeadlessLayerList, HeadlessMapPreview, MaputnikUIRoot,
  useDirty, useHistory, useSelectedLayerId, useValidation,
} from "../../../src/headless/all";
import { SampleEditorProvider } from "./SampleEditorProvider";
import { useSampleEditor } from "./use-sample-editor";

export function UpstreamApp() {
  return <SampleEditorProvider><UpstreamEditor /></SampleEditorProvider>;
}

function UpstreamEditor() {
  const {activeId, busy, editor, library, openStyle, saveStyle, status} = useSampleEditor();
  const dirty = useDirty();
  const history = useHistory();
  const validation = useValidation();
  const selectedLayerId = useSelectedLayerId();

  const toolbar = <nav className="maputnik-toolbar" aria-label="Maputnik toolbar">
    <div className="maputnik-toolbar__inner">
      <a className="maputnik-toolbar-logo upstream-logo" href="https://github.com/maplibre/maputnik">
        <span className="upstream-logo-mark">M</span>
        <h1><span className="maputnik-toolbar-name">Maputnik</span><span className="maputnik-toolbar-version">headless</span></h1>
      </a>
      <div className="maputnik-toolbar__actions" role="navigation" aria-label="Editor actions">
        <label className="maputnik-toolbar-select upstream-library">
          <span className="maputnik-icon-text">Open style</span>
          <select data-wd-key="upstream:library" value={activeId} disabled={busy}
            onChange={event => void openStyle(event.target.value)}>
            {library.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <button className="maputnik-toolbar-action" data-wd-key="upstream:undo"
          disabled={!history.canUndo || busy} onClick={() => editor.undo()}><MdUndo /><span className="maputnik-icon-text">Undo</span></button>
        <button className="maputnik-toolbar-action" data-wd-key="upstream:redo"
          disabled={!history.canRedo || busy} onClick={() => editor.redo()}><MdRedo /><span className="maputnik-icon-text">Redo</span></button>
        <button className="maputnik-toolbar-action" data-wd-key="upstream:save"
          disabled={!dirty || busy} onClick={() => void saveStyle()}><MdSave /><span className="maputnik-icon-text">Save</span></button>
        <a className="maputnik-toolbar-link" href="/shadcn.html"><MdCode /><span className="maputnik-icon-text">shadcn variant</span></a>
      </div>
      <span className={dirty ? "upstream-dirty is-dirty" : "upstream-dirty"} data-wd-key="upstream:dirty">
        {dirty ? "Unsaved changes" : <><MdCheck /> Saved</>}
      </span>
    </div>
  </nav>;

  const bottom = <div className="upstream-status">
    <span role="status" data-wd-key="upstream:status">{status}</span>
    <span data-wd-key="upstream:selected">Selected: {selectedLayerId ?? "none"}</span>
    <span data-wd-key="upstream:history">History {history.index + 1}/{history.length}</span>
    <span>{validation.length} issues</span>
  </div>;

  return <MaputnikUIRoot className="upstream-editor-root">
    <AppLayout
      embedded
      toolbar={toolbar}
      layerList={<HeadlessLayerList />}
      layerEditor={<HeadlessLayerEditor />}
      map={<HeadlessMapPreview transformStyle={value => value} />}
      bottom={bottom}
    />
  </MaputnikUIRoot>;
}
