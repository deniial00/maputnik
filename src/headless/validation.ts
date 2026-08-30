import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import type { EditorValidationIssue, StyleSpecification } from "./types";

export function validateStyle(style: StyleSpecification): EditorValidationIssue[] {
  return (validateStyleMin(style) ?? []).map(error => {
    const match = error.message.match(/layers\[(\d+)\]\.(?:(\S+)\.)?(\S+):/);
    return {
      message: error.message,
      layerIndex: match ? Number(match[1]) : undefined,
      property: match ? [match[2], match[3]].filter(Boolean).join(".") : undefined,
    };
  });
}
