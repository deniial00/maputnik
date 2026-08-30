import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UpstreamApp } from "./UpstreamApp";
import "./upstream.css";

createRoot(document.getElementById("root")!).render(<StrictMode><UpstreamApp /></StrictMode>);
