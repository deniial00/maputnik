import { useEffect, useState, type ComponentProps } from "react";
import latest from "@maplibre/maplibre-gl-style-spec/dist/latest.json";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import type { LayerSpecification } from "../../../src/headless";
import { useEditorActions, useSelectedLayer, useStyle } from "../../../src/headless/all";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type PropertyDefinition = {
  default?: unknown;
  doc?: string;
  type?: string;
  values?: Record<string, unknown>;
};

type PropertyGroupName = "paint" | "layout";
type EditableLayer = LayerSpecification & Record<string, unknown>;

export function ShadcnLayerEditor() {
  const editor = useEditorActions();
  const selectedLayer = useSelectedLayer();
  const style = useStyle();

  if (!selectedLayer) {
    return <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">Select a layer to edit.</div>;
  }

  const layer: LayerSpecification = selectedLayer;
  const editable = layer as EditableLayer;
  const layerType = layer.type;
  const definitions = latest as unknown as Record<string, Record<string, PropertyDefinition>>;
  const paintDefinitions = definitions[`paint_${layerType}`] ?? {};
  const layoutDefinitions = definitions[`layout_${layerType}`] ?? {};
  const sourceId = typeof editable.source === "string" ? editable.source : "";
  const sourceLayer = typeof editable["source-layer"] === "string" ? editable["source-layer"] as string : "";
  const layerMetadata = layer.metadata as Record<string, unknown> | undefined;
  const comment = typeof layerMetadata?.["maputnik:comment"] === "string"
    ? layerMetadata["maputnik:comment"] as string
    : "";

  function updateTopLevel(key: string, value: unknown) {
    editor.updateLayer(layer.id, current => {
      const next = current as EditableLayer;
      if (value === undefined || value === "") delete next[key];
      else next[key] = value;
      return next;
    });
  }

  function updateComment(value: string) {
    editor.updateLayer(layer.id, current => {
      const metadata = {...(current.metadata as Record<string, unknown> | undefined)};
      if (value.trim()) metadata["maputnik:comment"] = value;
      else delete metadata["maputnik:comment"];
      const next = current as EditableLayer;
      if (Object.keys(metadata).length) next.metadata = metadata;
      else delete next.metadata;
      return next;
    });
  }

  function updateGroupProperty(group: PropertyGroupName, name: string, value: unknown) {
    editor.updateLayer(layer.id, current => {
      const next = current as EditableLayer;
      const properties = {...(next[group] as Record<string, unknown> | undefined)};
      if (value === undefined) delete properties[name];
      else properties[name] = value;
      if (Object.keys(properties).length) next[group] = properties;
      else delete next[group];
      return next;
    });
  }

  function renameLayer(nextId: string) {
    const normalized = nextId.trim();
    const duplicate = style.layers.some(candidate => candidate.id === normalized && candidate.id !== layer.id);
    if (normalized && normalized !== layer.id && !duplicate) {
      editor.replaceLayer(layer.id, {...layer, id: normalized} as LayerSpecification);
    }
  }

  return <section className="h-full overflow-y-auto bg-background" data-wd-key="shadcn:layer-editor">
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold" data-wd-key="shadcn:layer-heading">Layer: {layer.id}</h2>
        <p className="text-xs text-muted-foreground">Headless fields rendered with shadcn</p>
      </div>
      <Badge variant="outline">{layer.type}</Badge>
      <Button variant="ghost" size="icon-sm" aria-label="Duplicate layer" onClick={() => editor.duplicateLayer(layer.id)}>
        <Copy />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Delete layer" onClick={() => editor.removeLayer(layer.id)}>
        <Trash2 />
      </Button>
    </header>

    <div className="grid gap-5 p-4">
      <PropertySection title="Layer">
        <Field label="ID">
          <DraftInput value={layer.id} name="layer-id" wdKey="shadcn:layer-id" onCommit={renameLayer} />
        </Field>
        <Field label="Type"><Input value={layer.type} disabled /></Field>
        {"source" in layer && <Field label="Source">
          <Select value={sourceId} onValueChange={value => updateTopLevel("source", value)}>
            <SelectTrigger className="w-full" data-wd-key="shadcn:source"><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>{Object.keys(style.sources).map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
          </Select>
        </Field>}
        {"source" in layer && <Field label="Source layer">
          <DraftInput value={sourceLayer} name="source-layer" placeholder="Optional vector source layer"
            onCommit={value => updateTopLevel("source-layer", value)} />
        </Field>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min zoom">
            <DraftInput value={layer.minzoom ?? 0} type="number" min={0} max={24} name="minzoom"
              onCommit={value => updateTopLevel("minzoom", numberOrUndefined(value))} />
          </Field>
          <Field label="Max zoom">
            <DraftInput value={layer.maxzoom ?? 24} type="number" min={0} max={24} name="maxzoom"
              onCommit={value => updateTopLevel("maxzoom", numberOrUndefined(value))} />
          </Field>
        </div>
        <Field label="Comments">
          <DraftTextarea value={comment} name="comments" placeholder="Optional layer notes" onCommit={updateComment} />
        </Field>
      </PropertySection>

      <Separator />
      <PropertySection title="Filter" description="MapLibre expression JSON">
        <JsonDraft value={editable.filter} name="filter" placeholder="No filter" onCommit={value => updateTopLevel("filter", value)} />
      </PropertySection>

      <Separator />
      <SpecPropertySection title="Paint properties" group="paint" definitions={paintDefinitions}
        values={(editable.paint as Record<string, unknown> | undefined) ?? {}} onChange={updateGroupProperty} />

      <Separator />
      <SpecPropertySection title="Layout properties" group="layout" definitions={layoutDefinitions}
        values={(editable.layout as Record<string, unknown> | undefined) ?? {}} onChange={updateGroupProperty} />
    </div>
  </section>;
}

function PropertySection({title, description, children}: {title: string; description?: string; children: React.ReactNode}) {
  return <section className="grid gap-3">
    <div><h3 className="text-sm font-semibold">{title}</h3>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>
    {children}
  </section>;
}

function SpecPropertySection({title, group, definitions, values, onChange}: {
  title: string;
  group: PropertyGroupName;
  definitions: Record<string, PropertyDefinition>;
  values: Record<string, unknown>;
  onChange(group: PropertyGroupName, name: string, value: unknown): void;
}) {
  return <PropertySection title={title}>
    {Object.entries(definitions).map(([name, definition]) => <SpecPropertyField key={name} name={name}
      definition={definition} value={values[name]} explicit={Object.prototype.hasOwnProperty.call(values, name)}
      onChange={value => onChange(group, name, value)} />)}
  </PropertySection>;
}

function SpecPropertyField({name, definition, value, explicit, onChange}: {
  name: string;
  definition: PropertyDefinition;
  value: unknown;
  explicit: boolean;
  onChange(value: unknown): void;
}) {
  const shownValue = explicit ? value : definition.default;
  const label = humanize(name);
  const complex = Array.isArray(shownValue) || (shownValue !== null && typeof shownValue === "object");

  return <div className="grid gap-1.5" data-wd-key={`shadcn:property:${name}`}>
    <div className="flex items-center gap-2">
      <Label className="min-w-0 flex-1 truncate" title={definition.doc}>{label}</Label>
      {!explicit && <span className="text-[10px] text-muted-foreground">default</span>}
      {explicit && <Button variant="ghost" size="icon-xs" aria-label={`Reset ${label}`} onClick={() => onChange(undefined)}>
        <RotateCcw />
      </Button>}
    </div>
    {complex
      ? <JsonDraft value={shownValue} name={name} onCommit={onChange} />
      : <ScalarProperty name={name} definition={definition} value={shownValue} onChange={onChange} />}
  </div>;
}

function ScalarProperty({name, definition, value, onChange}: {
  name: string;
  definition: PropertyDefinition;
  value: unknown;
  onChange(value: unknown): void;
}) {
  if (definition.type === "boolean") {
    return <div className="flex h-8 items-center justify-between rounded-lg border px-2.5">
      <span className="text-xs text-muted-foreground">{value ? "Enabled" : "Disabled"}</span>
      <Switch checked={Boolean(value)} onCheckedChange={onChange} data-wd-key={`shadcn:input:${name}`} />
    </div>;
  }

  if (definition.type === "enum" && definition.values) {
    return <Select value={String(value ?? "")} onValueChange={onChange}>
      <SelectTrigger className="w-full" data-wd-key={`shadcn:input:${name}`}><SelectValue /></SelectTrigger>
      <SelectContent>{Object.keys(definition.values).map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>;
  }

  const numeric = definition.type === "number";
  return <DraftInput value={value == null ? "" : String(value)} name={name} type={numeric ? "number" : "text"}
    wdKey={`shadcn:input:${name}`} onCommit={next => onChange(numeric ? numberOrUndefined(next) : next)} />;
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}

function DraftInput({value, onCommit, wdKey, ...props}: {
  value: string | number;
  onCommit(value: string): void;
  wdKey?: string;
} & Omit<ComponentProps<typeof Input>, "value" | "defaultValue" | "onChange" | "onBlur">) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <Input {...props} value={draft} data-wd-key={wdKey} onChange={event => setDraft(event.target.value)}
    onBlur={() => { if (draft !== String(value)) onCommit(draft); }}
    onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />;
}

function DraftTextarea({value, onCommit, ...props}: {
  value: string;
  onCommit(value: string): void;
} & Omit<ComponentProps<typeof Textarea>, "value" | "defaultValue" | "onChange" | "onBlur">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <Textarea {...props} value={draft} onChange={event => setDraft(event.target.value)}
    onBlur={() => { if (draft !== value) onCommit(draft); }} />;
}

function JsonDraft({value, onCommit, name, placeholder}: {
  value: unknown;
  onCommit(value: unknown): void;
  name: string;
  placeholder?: string;
}) {
  const serialized = value === undefined ? "" : JSON.stringify(value, null, 2);
  const [draft, setDraft] = useState(serialized);
  const [error, setError] = useState(false);
  useEffect(() => { setDraft(serialized); setError(false); }, [serialized]);

  function commit() {
    if (draft === serialized) return;
    if (!draft.trim()) { setError(false); onCommit(undefined); return; }
    try { onCommit(JSON.parse(draft)); setError(false); }
    catch { setError(true); }
  }

  return <div className="grid gap-1">
    <Textarea className="min-h-20 font-mono text-xs" name={name} value={draft} aria-invalid={error || undefined}
      placeholder={placeholder} onChange={event => setDraft(event.target.value)} onBlur={commit} />
    {error && <span className="text-xs text-destructive">Enter valid JSON before leaving this field.</span>}
  </div>;
}

function numberOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function humanize(value: string): string {
  const words = value.split("-");
  const relevant = words.length > 1 ? words.slice(1) : words;
  return relevant.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
