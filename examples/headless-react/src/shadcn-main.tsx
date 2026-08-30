import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./host.css";
import { ShadcnApp } from "./ShadcnApp";

createRoot(document.getElementById("root")!).render(<StrictMode><ShadcnApp /></StrictMode>);
