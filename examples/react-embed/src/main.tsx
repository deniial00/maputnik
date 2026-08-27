import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./host.css";

createRoot(document.getElementById("host-root")!).render(<StrictMode><App /></StrictMode>);
