import { createContext, type RefObject } from "react";

/** Internal scope for portals and keyboard navigation; null in the web app. */
export const EditorScopeContext = createContext<RefObject<HTMLDivElement | null> | null>(null);
