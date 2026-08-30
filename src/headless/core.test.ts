import { describe, expect, it, vi } from "vitest";
import { createHeadlessEditor } from "./core";
import type { StyleSpecification } from "./types";

function style(name = "Initial"): StyleSpecification {
  return {
    version: 8,
    name,
    sources: {places: {type: "geojson", data: {type: "FeatureCollection", features: []}}},
    layers: [
      {id: "background", type: "background", paint: {"background-color": "#ffffff"}},
      {id: "places", type: "circle", source: "places", paint: {"circle-color": "#225566"}},
    ],
  };
}

describe("HeadlessEditorStore", () => {
  it("owns inputs and returned style snapshots", () => {
    const input = style();
    const editor = createHeadlessEditor({initialStyle: input});
    input.name = "mutated outside";
    const result = editor.getStyle();
    result.name = "mutated result";
    expect(editor.getState().style.name).toBe("Initial");
    expect(Object.isFrozen(editor.getState().style)).toBe(true);
    expect(() => { editor.getState().style.name = "forbidden"; }).toThrow(TypeError);
  });

  it("records updates and traverses bounded history", () => {
    const editor = createHeadlessEditor({initialStyle: style(), maxHistory: 3});
    editor.updateStyle(draft => { draft.name = "One"; });
    editor.updateStyle(draft => { draft.name = "Two"; });
    editor.updateStyle(draft => { draft.name = "Three"; });
    expect(editor.getState().history).toMatchObject({index: 2, length: 3, canUndo: true, canRedo: false});
    editor.undo();
    expect(editor.getState().style.name).toBe("Two");
    editor.undo();
    expect(editor.getState().style.name).toBe("One");
    editor.redo();
    expect(editor.getState().style.name).toBe("Two");
  });

  it("loads a clean repository document and tracks save acknowledgement", () => {
    const editor = createHeadlessEditor({initialStyle: style()});
    editor.updateStyle(draft => { draft.name = "Draft"; });
    expect(editor.getState().dirty).toBe(true);
    editor.markClean();
    expect(editor.getState().dirty).toBe(false);
    editor.loadStyle(style("Library style"));
    expect(editor.getState()).toMatchObject({dirty: false, history: {length: 1, canUndo: false}});
  });

  it("keeps layer selection valid across layer commands", () => {
    const editor = createHeadlessEditor({initialStyle: style()});
    editor.selectLayer("places");
    editor.duplicateLayer("places");
    expect(editor.getState().selectedLayerId).toBe("places-copy");
    editor.removeLayer("places-copy");
    expect(editor.getState().selectedLayerId).toBe("places");
    editor.toggleLayerVisibility("places");
    expect(editor.getState().style.layers[1].layout?.visibility).toBe("none");
    editor.moveLayer(1, 0);
    expect(editor.getState().style.layers.map(layer => layer.id)).toEqual(["places", "background"]);
    editor.selectLayer(null);
    editor.updateStyle(draft => { draft.name = "Selection remains empty"; });
    expect(editor.getState().selectedLayerId).toBeNull();
  });

  it("updates layer ids without allowing duplicates", () => {
    const editor = createHeadlessEditor({initialStyle: style()});
    editor.selectLayer("places");
    editor.replaceLayer("places", {...editor.getState().style.layers[1], id: "points"});
    expect(editor.getState().selectedLayerId).toBe("points");
    expect(() => editor.addLayer({id: "points", type: "background"})).toThrow("Layer already exists");
  });

  it("renames sources and guards dependent source removal", () => {
    const editor = createHeadlessEditor({initialStyle: style()});
    editor.renameSource("places", "features");
    expect(editor.getState().style.layers[1]).toMatchObject({source: "features"});
    expect(() => editor.removeSource("features")).toThrow("Source features is used by: places");
    editor.removeSource("features", {cascade: true});
    expect(editor.getState().style.sources).toEqual({});
    expect(editor.getState().style.layers.map(layer => layer.id)).toEqual(["background"]);
  });

  it("publishes stable state only when commands change observable state", () => {
    const editor = createHeadlessEditor({initialStyle: style()});
    const listener = vi.fn();
    const unsubscribe = editor.subscribe(listener);
    editor.selectLayer("places");
    editor.selectLayer("places");
    editor.replaceStyle(editor.getStyle());
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    editor.selectLayer("background");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("supports an injected validation policy", () => {
    const editor = createHeadlessEditor({
      initialStyle: style(),
      validate: value => value.name ? [] : [{message: "A style name is required"}],
    });
    editor.updateStyle(draft => { delete draft.name; });
    expect(editor.getState().validation).toEqual([{message: "A style name is required"}]);
  });
});
