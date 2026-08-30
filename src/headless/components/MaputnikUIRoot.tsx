import { useRef, type CSSProperties, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { ColorFilters } from "../../editor/ColorFilters";
import { EditorScopeContext } from "../../editor/environment";
import { editorI18n } from "../../editor/i18n";
import "../../editor/editor.scss";

type MaputnikUIRootProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function MaputnikUIRoot({children, className, style}: MaputnikUIRootProps) {
  const scope = useRef<HTMLDivElement>(null);
  return <div ref={scope} className={["maputnik-editor", "maputnik-headless-ui", className].filter(Boolean).join(" ")}
    style={style} tabIndex={-1} data-wd-key="headless:editor">
    <ColorFilters />
    <EditorScopeContext.Provider value={scope}>
      <I18nextProvider i18n={editorI18n}>{children}</I18nextProvider>
    </EditorScopeContext.Provider>
    <div className="maputnik-editor__modals" />
  </div>;
}
