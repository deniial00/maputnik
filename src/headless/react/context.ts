import { createContext } from "react";
import type { HeadlessEditorStore } from "../core";

export const HeadlessEditorContext = createContext<HeadlessEditorStore | null>(null);
