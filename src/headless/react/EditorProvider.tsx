import { useState, type ReactNode } from "react";
import { createHeadlessEditor, type HeadlessEditorStore } from "../core";
import type { HeadlessEditorOptions, StyleSpecification } from "../types";
import { HeadlessEditorContext } from "./context";

type EditorProviderProps = {
  children: ReactNode;
  editor?: HeadlessEditorStore;
  initialStyle?: StyleSpecification;
  options?: Omit<HeadlessEditorOptions, "initialStyle">;
};

export function EditorProvider({children, editor, initialStyle, options}: EditorProviderProps) {
  const [store] = useState(() => {
    if (editor) return editor;
    if (!initialStyle) throw new Error("EditorProvider requires editor or initialStyle");
    return createHeadlessEditor({initialStyle, ...options});
  });
  return <HeadlessEditorContext.Provider value={store}>{children}</HeadlessEditorContext.Provider>;
}
