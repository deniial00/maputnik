import { useEffect, useMemo, useState } from "react";
import AriaModal from "react-aria-modal";
import { X } from "lucide-react";
import type { LayerSpecification, SourceSpecification } from "../../../src/headless";
import { useEditorActions, useStyle } from "../../../src/headless/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type LayerType = LayerSpecification["type"];

const layerTypes: LayerType[] = [
  "background", "fill", "line", "symbol", "circle", "heatmap",
  "fill-extrusion", "raster", "hillshade", "color-relief",
];

export function AddLayerDialog({open, onClose}: {open: boolean; onClose(): void}) {
  const editor = useEditorActions();
  const style = useStyle();
  const [id, setId] = useState("");
  const [type, setType] = useState<LayerType>("fill");
  const [source, setSource] = useState("");
  const [sourceLayer, setSourceLayer] = useState("");
  const [error, setError] = useState("");
  const [dialogNode, setDialogNode] = useState<HTMLElement | null>(null);
  const sources = useMemo(() => eligibleSources(style.sources, type), [style.sources, type]);

  useEffect(() => {
    if (!open) return;
    setId("");
    setType("fill");
    setSource(eligibleSources(style.sources, "fill")[0] ?? "");
    setSourceLayer("");
    setError("");
  }, [open, style.sources]);

  useEffect(() => {
    if (type === "background") { setSource(""); setSourceLayer(""); return; }
    if (!sources.includes(source)) setSource(sources[0] ?? "");
  }, [source, sources, type]);

  if (!open) return null;

  const sourceDefinition = source ? style.sources[source] : undefined;
  const vectorSource = sourceDefinition?.type === "vector";

  function addLayer() {
    const normalizedId = id.trim();
    if (!normalizedId) { setError("Enter a layer ID."); return; }
    if (style.layers.some(layer => layer.id === normalizedId)) { setError("Layer ID already exists."); return; }
    if (type !== "background" && !source) { setError("No compatible source is available for this layer type."); return; }

    const layer: Record<string, unknown> = {id: normalizedId, type};
    if (type !== "background") layer.source = source;
    if (vectorSource && sourceLayer.trim()) layer["source-layer"] = sourceLayer.trim();
    editor.addLayer(layer as LayerSpecification);
    onClose();
  }

  return <AriaModal
    titleId="shadcn-add-layer-title"
    onExit={onClose}
    initialFocus="#shadcn-add-layer-id"
    getApplicationNode={() => document.getElementById("root")!}
    verticallyCenter
    underlayStyle={{zIndex: 3000, padding: "24px"}}
    dialogStyle={{margin: "auto"}}
  >
    <section ref={setDialogNode} className="w-[min(92vw,480px)] rounded-xl bg-background p-5 text-foreground shadow-2xl ring-1 ring-foreground/10"
      data-wd-key="shadcn:add-layer-modal">
      <header className="mb-5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="shadcn-add-layer-title" className="text-lg font-semibold">Add layer</h2>
          <p className="text-sm text-muted-foreground">Create a layer through the headless editor core.</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close add layer dialog" onClick={onClose}><X /></Button>
      </header>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="shadcn-add-layer-id">Layer ID</Label>
          <Input id="shadcn-add-layer-id" data-wd-key="shadcn:add-layer-id" value={id}
            onChange={event => { setId(event.target.value); setError(""); }} />
        </div>
        <div className="grid gap-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={value => { setType(value as LayerType); setError(""); }}>
            <SelectTrigger className="w-full" data-wd-key="shadcn:add-layer-type"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[3101]" portalContainer={dialogNode}>
              {layerTypes.map(value => <SelectItem key={value} value={value}
                data-wd-key={`shadcn:add-layer-type-option:${value}`}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {type !== "background" && <div className="grid gap-1.5">
          <Label>Source</Label>
          {sources.length === 1
            ? <Input value={sources[0]} disabled data-wd-key="shadcn:add-layer-source-readonly" />
            : <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-full" data-wd-key="shadcn:add-layer-source"><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent className="z-[3101]" portalContainer={dialogNode}>
                {sources.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>}
          {!sources.length && <p className="text-xs text-destructive">No compatible sources are available.</p>}
        </div>}

        {type !== "background" && vectorSource && <div className="grid gap-1.5">
          <Label htmlFor="shadcn-add-source-layer">Source layer</Label>
          <Input id="shadcn-add-source-layer" value={sourceLayer} placeholder="Vector source layer"
            onChange={event => setSourceLayer(event.target.value)} />
        </div>}

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}

        <footer className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button data-wd-key="shadcn:confirm-add-layer" onClick={addLayer}>Add layer</Button>
        </footer>
      </div>
    </section>
  </AriaModal>;
}

function eligibleSources(sources: Record<string, SourceSpecification>, type: LayerType): string[] {
  if (type === "background") return [];
  return Object.entries(sources).filter(([, source]) => {
    if (type === "hillshade" || type === "color-relief") return source.type === "raster-dem";
    if (type === "raster") return source.type === "raster" || source.type === "image" || source.type === "video";
    return source.type === "vector" || source.type === "geojson";
  }).map(([id]) => id);
}
