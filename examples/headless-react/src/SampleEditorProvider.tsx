import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createHeadlessEditor, EditorProvider } from "../../../src/headless/all";
import { bootstrapStyle, fetchStyle, listStyles, updateStyle, type StyleSummary } from "./repository";
import { SampleEditorContext } from "./sample-context";

export function SampleEditorProvider({children}: {children: ReactNode}) {
  const editor = useMemo(() => createHeadlessEditor({initialStyle: bootstrapStyle, maxHistory: 75}), []);
  const [library, setLibrary] = useState<StyleSummary[]>([]);
  const [activeId, setActiveId] = useState("vienna-day");
  const [status, setStatus] = useState("Loading style library…");
  const [busy, setBusy] = useState(false);

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
      const style = editor.getStyle();
      await updateStyle(activeId, style);
      editor.markClean();
      setStatus(`Saved ${style.name} through the host repository adapter`);
    } finally {
      setBusy(false);
    }
  }

  return <SampleEditorContext.Provider value={{activeId, busy, editor, library, openStyle, saveStyle, status}}>
    <EditorProvider editor={editor}>{children}</EditorProvider>
  </SampleEditorContext.Provider>;
}
