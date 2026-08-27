import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import type { CSSProperties } from "react";

export interface MaputnikEditorProps {
  /** Read once per mount. Use setStyle() to replace the document later. */
  initialStyle: StyleSpecification;
  /** Dirty signal after a committed change, including setStyle/reset/undo. */
  onStyleChange?: () => void;
  className?: string;
  style?: CSSProperties;
}

export interface MaputnikEditorHandle {
  /** Returns an independent copy of the complete edited document. */
  getStyle(): StyleSpecification;
  /** Replaces the document and clears selection and undo history. */
  setStyle(style: StyleSpecification): void;
  /** Restores the initialStyle captured at mount and clears undo history. */
  reset(): void;
}
