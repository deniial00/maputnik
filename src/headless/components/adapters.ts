import type { MappedError } from "../../libs/definitions";
import type { EditorValidationIssue, SourceSpecification, StyleSpecification } from "../types";

export type EditorSource = SourceSpecification & {layers: string[]};

export function toEditorSources(style: StyleSpecification): Record<string, EditorSource> {
  return Object.fromEntries(Object.entries(style.sources).map(([id, source]) => [id, {...source, layers: []}])) as Record<string, EditorSource>;
}

export function toMappedErrors(issues: EditorValidationIssue[]): MappedError[] {
  return issues.map(issue => issue.layerIndex === undefined ? {message: issue.message} : {
    message: issue.message,
    parsed: {
      type: "layer",
      data: {
        index: issue.layerIndex,
        key: issue.property ?? "",
        message: issue.message,
      },
    },
  });
}
