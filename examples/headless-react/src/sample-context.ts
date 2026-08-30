import { createContext } from "react";
import type { HeadlessEditorStore } from "../../../src/headless";
import type { StyleSummary } from "./repository";

export type SampleEditorContextValue = {
  activeId: string;
  busy: boolean;
  editor: HeadlessEditorStore;
  library: StyleSummary[];
  openStyle(id: string): Promise<void>;
  saveStyle(): Promise<void>;
  status: string;
};

export const SampleEditorContext = createContext<SampleEditorContextValue | null>(null);
