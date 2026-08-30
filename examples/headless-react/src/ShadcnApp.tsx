import { Braces, ExternalLink, Layers3, Redo2, Save, Undo2 } from "lucide-react";
import {
  HeadlessLayerEditor, HeadlessMapPreview, MaputnikUIRoot, useDirty, useHistory,
  useLayers, useSelectedLayerId, useStyle, useValidation,
} from "../../../src/headless/all";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SampleEditorProvider } from "./SampleEditorProvider";
import { useSampleEditor } from "./use-sample-editor";

export function ShadcnApp() {
  return <SampleEditorProvider><ShadcnEditor /></SampleEditorProvider>;
}

function ShadcnEditor() {
  const {activeId, busy, editor, library, openStyle, saveStyle, status} = useSampleEditor();
  const style = useStyle();
  const layers = useLayers();
  const selectedLayerId = useSelectedLayerId();
  const dirty = useDirty();
  const history = useHistory();
  const validation = useValidation();

  return <main className="min-h-screen bg-muted/40 text-foreground" data-wd-key="shadcn:root">
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-4">
        <div className="grid size-9 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">M</div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{style.name}</h1>
          <p className="text-xs text-muted-foreground">Headless Maputnik with a focused shadcn interface</p>
        </div>
        <Badge variant={dirty ? "destructive" : "secondary"} data-wd-key="shadcn:dirty">
          {dirty ? "Unsaved changes" : "Saved"}
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-wd-key="shadcn:undo" disabled={!history.canUndo || busy}
            onClick={() => editor.undo()}><Undo2 data-icon="inline-start" />Undo</Button>
          <Button variant="outline" size="sm" data-wd-key="shadcn:redo" disabled={!history.canRedo || busy}
            onClick={() => editor.redo()}><Redo2 data-icon="inline-start" />Redo</Button>
          <Button size="sm" data-wd-key="shadcn:save" disabled={!dirty || busy}
            onClick={() => void saveStyle()}><Save data-icon="inline-start" />Save style</Button>
          <Button variant="ghost" size="sm" asChild><a href="/"><ExternalLink data-icon="inline-start" />Upstream layout</a></Button>
        </div>
      </div>
    </header>

    <div className="mx-auto grid max-w-[1600px] grid-cols-[260px_minmax(0,1fr)] gap-4 p-6">
      <aside className="grid content-start gap-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Style library</CardTitle>
            <CardDescription>Host-owned fetchStyle integration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {library.map(item => <Button key={item.id} variant={item.id === activeId ? "secondary" : "ghost"}
              className="h-auto justify-start px-3 py-2 text-left" data-wd-key={`shadcn:library:${item.id}`}
              disabled={busy} onClick={() => void openStyle(item.id)}>
              <span className={item.id === "vienna-night" ? "style-dot is-night" : "style-dot"} />
              <span className="grid min-w-0 gap-0.5"><strong className="truncate text-xs">{item.name}</strong>
                <span className="truncate text-[10px] font-normal text-muted-foreground">{item.description}</span></span>
            </Button>)}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers3 className="size-4" />Layers</CardTitle>
            <CardDescription>Custom list backed by useLayers()</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1">
            {layers.map(layer => <Button key={layer.id} variant={layer.id === selectedLayerId ? "secondary" : "ghost"}
              size="sm" className="justify-start" data-wd-key={`shadcn:layer:${layer.id}`}
              onClick={() => editor.selectLayer(layer.id)}>
              <span className="size-1.5 rounded-full bg-current opacity-60" />{layer.id}
            </Button>)}
          </CardContent>
        </Card>
      </aside>

      <Card className="min-w-0">
        <CardHeader className="border-b">
          <CardTitle>Style editor</CardTitle>
          <CardDescription>Maputnik editor components embedded inside shadcn composition</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor" data-wd-key="shadcn:tab:editor"><Layers3 />Editor</TabsTrigger>
              <TabsTrigger value="json" data-wd-key="shadcn:tab:json"><Braces />Style JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <MaputnikUIRoot className="shadcn-maputnik-runtime">
                <div className="shadcn-runtime-grid">
                  <div className="shadcn-runtime-editor"><HeadlessLayerEditor /></div>
                  <div className="shadcn-runtime-map"><HeadlessMapPreview transformStyle={value => value} /></div>
                </div>
              </MaputnikUIRoot>
            </TabsContent>
            <TabsContent value="json">
              <pre className="max-h-[680px] overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100"
                data-wd-key="shadcn:json">{JSON.stringify(style, null, 2)}</pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>

    <footer className="mx-auto flex max-w-[1600px] items-center gap-5 px-6 pb-6 text-xs text-muted-foreground">
      <span className="flex-1" role="status" data-wd-key="shadcn:status">{status}</span>
      <span data-wd-key="shadcn:selected">Selected: {selectedLayerId ?? "none"}</span>
      <span data-wd-key="shadcn:history">History {history.index + 1}/{history.length}</span>
      <span>{validation.length} issues</span>
    </footer>
  </main>;
}
