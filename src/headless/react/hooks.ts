import { useCallback, useContext, useRef, useSyncExternalStore } from "react";
import type { HeadlessEditorStore } from "../core";
import type { HeadlessEditorState, LayerSpecification, StyleSpecification } from "../types";
import { HeadlessEditorContext } from "./context";

export function useEditorStore(): HeadlessEditorStore {
  const editor = useContext(HeadlessEditorContext);
  if (!editor) throw new Error("Headless editor hooks require an EditorProvider");
  return editor;
}

export function useEditorSelector<T>(
  selector: (state: HeadlessEditorState) => T,
  equality: (left: T, right: T) => boolean = Object.is,
): T {
  const editor = useEditorStore();
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equality);
  const cache = useRef<{
    state: HeadlessEditorState;
    selector: (state: HeadlessEditorState) => T;
    value: T;
  } | undefined>(undefined);
  selectorRef.current = selector;
  equalityRef.current = equality;

  const getSnapshot = useCallback(() => {
    const state = editor.getState();
    if (cache.current?.state === state && cache.current.selector === selectorRef.current) return cache.current.value;
    const next = selectorRef.current(state);
    if (cache.current && equalityRef.current(cache.current.value, next)) {
      cache.current = {state, selector: selectorRef.current, value: cache.current.value};
    } else {
      cache.current = {state, selector: selectorRef.current, value: next};
    }
    return cache.current.value;
  }, [editor]);

  return useSyncExternalStore(editor.subscribe, getSnapshot, getSnapshot);
}

const selectStyle = (state: HeadlessEditorState): StyleSpecification => state.style;
const selectLayers = (state: HeadlessEditorState): LayerSpecification[] => state.style.layers;
const selectSelectedLayerId = (state: HeadlessEditorState): string | null => state.selectedLayerId;
const selectSelectedLayer = (state: HeadlessEditorState): LayerSpecification | undefined =>
  state.style.layers.find(layer => layer.id === state.selectedLayerId);
const selectDirty = (state: HeadlessEditorState) => state.dirty;
const selectHistory = (state: HeadlessEditorState) => state.history;
const selectValidation = (state: HeadlessEditorState) => state.validation;

export const useStyle = () => useEditorSelector(selectStyle);
export const useLayers = () => useEditorSelector(selectLayers);
export const useSelectedLayerId = () => useEditorSelector(selectSelectedLayerId);
export const useSelectedLayer = () => useEditorSelector(selectSelectedLayer);
export const useDirty = () => useEditorSelector(selectDirty);
export const useHistory = () => useEditorSelector(selectHistory);
export const useValidation = () => useEditorSelector(selectValidation);
export const useEditorActions = useEditorStore;
