import { useContext } from "react";
import { SampleEditorContext } from "./sample-context";

export function useSampleEditor() {
  const sample = useContext(SampleEditorContext);
  if (!sample) throw new Error("useSampleEditor requires a SampleEditorProvider");
  return sample;
}
