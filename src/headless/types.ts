import type { LayerSpecification, SourceSpecification, StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

export type EditorAction =
  | "initialize" | "load" | "replace" | "update" | "mark-clean"
  | "select-layer" | "add-layer" | "replace-layer" | "remove-layer"
  | "duplicate-layer" | "move-layer" | "toggle-layer-visibility"
  | "set-source" | "rename-source" | "remove-source" | "undo" | "redo";

export type EditorValidationIssue = {
  message: string;
  layerIndex?: number;
  property?: string;
};

export type EditorHistoryState = {
  index: number;
  length: number;
  canUndo: boolean;
  canRedo: boolean;
};

export type HeadlessEditorState = {
  style: StyleSpecification;
  selectedLayerId: string | null;
  dirty: boolean;
  validation: EditorValidationIssue[];
  history: EditorHistoryState;
  revision: number;
  documentRevision: number;
  lastAction: EditorAction;
};

export type StyleValidator = (style: StyleSpecification) => EditorValidationIssue[];

export type HeadlessEditorOptions = {
  initialStyle: StyleSpecification;
  maxHistory?: number;
  validate?: StyleValidator;
};

export type LoadStyleOptions = {
  markClean?: boolean;
  selectedLayerId?: string | null;
};

export type RemoveSourceOptions = {
  cascade?: boolean;
};

export type StyleUpdater = (draft: StyleSpecification) => void | StyleSpecification;
export type LayerUpdater = (layer: LayerSpecification) => LayerSpecification;
export type EditorListener = () => void;

export type { LayerSpecification, SourceSpecification, StyleSpecification };
