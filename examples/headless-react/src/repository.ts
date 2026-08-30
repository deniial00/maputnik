import type { StyleSpecification } from "../../../src/headless";
import type { BackgroundLayerSpecification, FillLayerSpecification } from "@maplibre/maplibre-gl-style-spec";
import { initialStyle } from "../../react-embed/src/styles";

export type StyleSummary = {id: string; name: string; description: string};

const nightStyle = structuredClone(initialStyle);
nightStyle.name = "Vienna · Night operations";
nightStyle.metadata = {...nightStyle.metadata as Record<string, unknown>, "host:library-id": "vienna-night"};
(nightStyle.layers.find(layer => layer.id === "background") as BackgroundLayerSpecification).paint = {"background-color": "#152d36"};
(nightStyle.layers.find(layer => layer.id === "districts") as FillLayerSpecification).paint = {
  "fill-color": "#263f45",
  "fill-outline-color": "#41616a",
};

const dayStyle = structuredClone(initialStyle);
dayStyle.metadata = {...dayStyle.metadata as Record<string, unknown>, "host:library-id": "vienna-day"};

const documents = new Map<string, StyleSpecification>([
  ["vienna-day", dayStyle],
  ["vienna-night", nightStyle],
]);

const summaries: StyleSummary[] = [
  {id: "vienna-day", name: "Vienna Daylight", description: "Local GeoJSON · six layers"},
  {id: "vienna-night", name: "Night Operations", description: "Same data · alternate visual system"},
];

function delay() {
  return new Promise(resolve => setTimeout(resolve, 80));
}

export async function listStyles(): Promise<StyleSummary[]> {
  await delay();
  return structuredClone(summaries);
}

export async function fetchStyle(id: string): Promise<StyleSpecification> {
  await delay();
  const style = documents.get(id);
  if (!style) throw new Error(`Unknown library style: ${id}`);
  return structuredClone(style);
}

export async function updateStyle(id: string, style: StyleSpecification): Promise<void> {
  await delay();
  if (!documents.has(id)) throw new Error(`Unknown library style: ${id}`);
  documents.set(id, structuredClone(style));
}

export const bootstrapStyle = structuredClone(documents.get("vienna-day")!);
