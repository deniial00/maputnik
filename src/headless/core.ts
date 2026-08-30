import cloneDeep from "lodash.clonedeep";
import isEqual from "lodash.isequal";
import type {
  EditorAction, EditorListener, HeadlessEditorOptions, HeadlessEditorState,
  LayerSpecification, LayerUpdater, LoadStyleOptions, RemoveSourceOptions,
  SourceSpecification, StyleSpecification, StyleUpdater,
} from "./types";
import { validateStyle } from "./validation";

type HistoryEntry = { style: StyleSpecification; selectedLayerId: string | null };

function selectedOrFallback(style: StyleSpecification, requested?: string | null): string | null {
  if (requested === null) return null;
  if (requested && style.layers.some(layer => layer.id === requested)) return requested;
  return style.layers[0]?.id ?? null;
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

function uniqueCopyId(layers: LayerSpecification[], base: string): string {
  const ids = new Set(layers.map(layer => layer.id));
  let candidate = `${base}-copy`;
  let suffix = 2;
  while (ids.has(candidate)) candidate = `${base}-copy-${suffix++}`;
  return candidate;
}

export class HeadlessEditorStore {
  private listeners = new Set<EditorListener>();
  private entries: HistoryEntry[];
  private historyIndex = 0;
  private cleanStyle: StyleSpecification;
  private state: HeadlessEditorState;
  private readonly maxHistory: number;
  private readonly validator: NonNullable<HeadlessEditorOptions["validate"]>;

  constructor(options: HeadlessEditorOptions) {
    const style = freezeDeep(cloneDeep(options.initialStyle));
    const selectedLayerId = selectedOrFallback(style);
    this.maxHistory = Math.max(1, options.maxHistory ?? 100);
    this.validator = options.validate ?? validateStyle;
    this.entries = [{style, selectedLayerId}];
    this.cleanStyle = cloneDeep(style);
    this.state = this.makeState(style, selectedLayerId, "initialize", 0, 0);
  }

  getState = (): HeadlessEditorState => this.state;

  getStyle(): StyleSpecification {
    return cloneDeep(this.state.style);
  }

  subscribe = (listener: EditorListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  loadStyle(style: StyleSpecification, options: LoadStyleOptions = {}): void {
    const snapshot = freezeDeep(cloneDeep(style));
    const selectedLayerId = selectedOrFallback(snapshot, options.selectedLayerId);
    this.entries = [{style: snapshot, selectedLayerId}];
    this.historyIndex = 0;
    if (options.markClean ?? true) this.cleanStyle = cloneDeep(snapshot);
    this.publish(snapshot, selectedLayerId, "load", true);
  }

  replaceStyle(style: StyleSpecification): void {
    this.commit(cloneDeep(style), "replace");
  }

  updateStyle(updater: StyleUpdater): void {
    const draft = this.getStyle();
    const result = updater(draft);
    this.commit(cloneDeep(result ?? draft), "update");
  }

  markClean(): void {
    if (!this.state.dirty) return;
    this.cleanStyle = this.getStyle();
    this.publish(this.state.style, this.state.selectedLayerId, "mark-clean", false);
  }

  selectLayer(layerId: string | null): void {
    if (layerId !== null && !this.state.style.layers.some(layer => layer.id === layerId)) {
      throw new Error(`Unknown layer: ${layerId}`);
    }
    if (layerId === this.state.selectedLayerId) return;
    this.entries[this.historyIndex].selectedLayerId = layerId;
    this.publish(this.state.style, layerId, "select-layer", false);
  }

  setLayers(layers: LayerSpecification[], action: EditorAction = "update"): void {
    this.commit({...this.state.style, layers: cloneDeep(layers)}, action);
  }

  addLayer(layer: LayerSpecification, index = this.state.style.layers.length): void {
    this.assertLayerIdAvailable(layer.id);
    const layers = this.state.style.layers.slice();
    layers.splice(Math.max(0, Math.min(index, layers.length)), 0, cloneDeep(layer));
    this.commit({...this.state.style, layers}, "add-layer", layer.id);
  }

  replaceLayer(layerId: string, layer: LayerSpecification): void {
    const index = this.layerIndex(layerId);
    if (layer.id !== layerId) this.assertLayerIdAvailable(layer.id);
    const layers = this.state.style.layers.slice();
    layers[index] = cloneDeep(layer);
    this.commit({...this.state.style, layers}, "replace-layer", layer.id);
  }

  updateLayer(layerId: string, updater: LayerUpdater): void {
    const layer = updater(cloneDeep(this.state.style.layers[this.layerIndex(layerId)]));
    this.replaceLayer(layerId, layer);
  }

  removeLayer(layerId: string): void {
    const index = this.layerIndex(layerId);
    const layers = this.state.style.layers.slice();
    layers.splice(index, 1);
    const selected = this.state.selectedLayerId === layerId
      ? layers[Math.min(index, layers.length - 1)]?.id ?? null
      : this.state.selectedLayerId;
    this.commit({...this.state.style, layers}, "remove-layer", selected);
  }

  duplicateLayer(layerId: string): void {
    const index = this.layerIndex(layerId);
    const layer = cloneDeep(this.state.style.layers[index]);
    layer.id = uniqueCopyId(this.state.style.layers, layer.id);
    const layers = this.state.style.layers.slice();
    layers.splice(index, 0, layer);
    this.commit({...this.state.style, layers}, "duplicate-layer", layer.id);
  }

  moveLayer(oldIndex: number, newIndex: number): void {
    const length = this.state.style.layers.length;
    if (!length) return;
    const from = Math.max(0, Math.min(oldIndex, length - 1));
    const to = Math.max(0, Math.min(newIndex, length - 1));
    if (from === to) return;
    const layers = this.state.style.layers.slice();
    const [layer] = layers.splice(from, 1);
    layers.splice(to, 0, layer);
    this.commit({...this.state.style, layers}, "move-layer");
  }

  toggleLayerVisibility(layerId: string): void {
    this.updateLayerWithAction(layerId, layer => ({
      ...layer,
      layout: {...layer.layout, visibility: layer.layout?.visibility === "none" ? "visible" : "none"},
    } as LayerSpecification), "toggle-layer-visibility");
  }

  setSource(sourceId: string, source: SourceSpecification): void {
    this.commit({...this.state.style, sources: {...this.state.style.sources, [sourceId]: cloneDeep(source)}}, "set-source");
  }

  renameSource(oldId: string, newId: string): void {
    if (!(oldId in this.state.style.sources)) throw new Error(`Unknown source: ${oldId}`);
    if (newId in this.state.style.sources) throw new Error(`Source already exists: ${newId}`);
    const sources = {...this.state.style.sources};
    sources[newId] = sources[oldId];
    delete sources[oldId];
    const layers = this.state.style.layers.map(layer => "source" in layer && layer.source === oldId
      ? {...layer, source: newId} as LayerSpecification
      : layer);
    this.commit({...this.state.style, sources, layers}, "rename-source");
  }

  removeSource(sourceId: string, options: RemoveSourceOptions = {}): void {
    if (!(sourceId in this.state.style.sources)) return;
    const dependent = this.state.style.layers.filter(layer => "source" in layer && layer.source === sourceId);
    if (dependent.length && !options.cascade) {
      throw new Error(`Source ${sourceId} is used by: ${dependent.map(layer => layer.id).join(", ")}`);
    }
    const sources = {...this.state.style.sources};
    delete sources[sourceId];
    const layers = options.cascade
      ? this.state.style.layers.filter(layer => !("source" in layer) || layer.source !== sourceId)
      : this.state.style.layers;
    this.commit({...this.state.style, sources, layers}, "remove-source");
  }

  undo(): void {
    if (!this.state.history.canUndo) return;
    this.historyIndex--;
    const entry = this.entries[this.historyIndex];
    this.publish(entry.style, selectedOrFallback(entry.style, entry.selectedLayerId), "undo", true);
  }

  redo(): void {
    if (!this.state.history.canRedo) return;
    this.historyIndex++;
    const entry = this.entries[this.historyIndex];
    this.publish(entry.style, selectedOrFallback(entry.style, entry.selectedLayerId), "redo", true);
  }

  private updateLayerWithAction(layerId: string, updater: LayerUpdater, action: EditorAction): void {
    const index = this.layerIndex(layerId);
    const layers = this.state.style.layers.slice();
    layers[index] = updater(cloneDeep(layers[index]));
    this.commit({...this.state.style, layers}, action);
  }

  private commit(style: StyleSpecification, action: EditorAction, selection = this.state.selectedLayerId): void {
    style = freezeDeep(style);
    const selectedLayerId = selectedOrFallback(style, selection);
    if (isEqual(style, this.state.style)) {
      if (selectedLayerId !== this.state.selectedLayerId) this.selectLayer(selectedLayerId);
      return;
    }
    this.entries = this.entries.slice(0, this.historyIndex + 1);
    this.entries.push({style, selectedLayerId});
    if (this.entries.length > this.maxHistory) this.entries.shift();
    this.historyIndex = this.entries.length - 1;
    this.publish(style, selectedLayerId, action, true);
  }

  private publish(style: StyleSpecification, selectedLayerId: string | null, action: EditorAction, documentChanged: boolean): void {
    this.state = this.makeState(
      style,
      selectedLayerId,
      action,
      this.state.revision + 1,
      this.state.documentRevision + (documentChanged ? 1 : 0),
    );
    this.listeners.forEach(listener => listener());
  }

  private makeState(
    style: StyleSpecification,
    selectedLayerId: string | null,
    lastAction: EditorAction,
    revision: number,
    documentRevision: number,
  ): HeadlessEditorState {
    const validation = freezeDeep(cloneDeep(this.validator(style)));
    const history = Object.freeze({
      index: this.historyIndex,
      length: this.entries.length,
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.entries.length - 1,
    });
    return Object.freeze({
      style,
      selectedLayerId,
      dirty: !isEqual(style, this.cleanStyle),
      validation,
      history,
      revision,
      documentRevision,
      lastAction,
    });
  }

  private layerIndex(layerId: string): number {
    const index = this.state.style.layers.findIndex(layer => layer.id === layerId);
    if (index < 0) throw new Error(`Unknown layer: ${layerId}`);
    return index;
  }

  private assertLayerIdAvailable(layerId: string): void {
    if (this.state.style.layers.some(layer => layer.id === layerId)) {
      throw new Error(`Layer already exists: ${layerId}`);
    }
  }
}

export function createHeadlessEditor(options: HeadlessEditorOptions): HeadlessEditorStore {
  return new HeadlessEditorStore(options);
}
