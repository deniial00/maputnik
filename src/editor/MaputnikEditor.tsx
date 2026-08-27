import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import cloneDeep from "lodash.clonedeep";
import { I18nextProvider } from "react-i18next";
import { App } from "../components/App";
import { EditorScopeContext } from "./environment";
import { ColorFilters } from "./ColorFilters";
import { editorI18n } from "./i18n";
import type { MaputnikEditorHandle, MaputnikEditorProps } from "./types";
import "./editor.scss";

export const MaputnikEditor = forwardRef<MaputnikEditorHandle, MaputnikEditorProps>(
  function MaputnikEditor({ initialStyle, onStyleChange, className, style }, ref) {
    const [initialSnapshot] = useState(() => cloneDeep(initialStyle));
    const app = useRef<App>(null);
    const scope = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getStyle: () => app.current!.getStyle(),
      setStyle: value => app.current!.replaceStyle(value),
      reset: () => app.current!.replaceStyle(initialSnapshot),
    }), [initialSnapshot]);

    return <div ref={scope} className={["maputnik-editor", className].filter(Boolean).join(" ")}
      style={style} tabIndex={-1} data-wd-key="embedded:editor">
      <ColorFilters />
      <EditorScopeContext.Provider value={scope}>
        <I18nextProvider i18n={editorI18n}>
          <App ref={app} embedded initialStyle={initialSnapshot} onStyleChange={onStyleChange} scope={scope} />
        </I18nextProvider>
      </EditorScopeContext.Provider>
      <div className="maputnik-editor__modals" />
    </div>;
  }
);
