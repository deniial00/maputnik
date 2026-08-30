import latest from "@maplibre/maplibre-gl-style-spec/dist/latest.json";
import { LayerEditor } from "../../components/LayerEditor";
import { useEditorActions, useEditorSelector } from "../react";
import { toEditorSources, toMappedErrors } from "./adapters";

export function HeadlessLayerEditor() {
  const editor = useEditorActions();
  const model = useEditorSelector(state => {
    const layerIndex = state.style.layers.findIndex(layer => layer.id === state.selectedLayerId);
    return {
      layerIndex,
      layer: state.style.layers[layerIndex],
      layerCount: state.style.layers.length,
      sources: toEditorSources(state.style),
      errors: toMappedErrors(state.validation),
    };
  });
  if (!model.layer) return <div className="maputnik-headless-empty">Select or add a layer.</div>;
  const layerId = model.layer.id;
  return <LayerEditor
    key={layerId}
    layer={model.layer}
    layerIndex={model.layerIndex}
    isFirstLayer={model.layerIndex === 0}
    isLastLayer={model.layerIndex === model.layerCount - 1}
    sources={model.sources}
    vectorLayers={{}}
    spec={latest}
    errors={model.errors}
    onMoveLayer={move => editor.moveLayer(move.oldIndex, move.newIndex)}
    onLayerChanged={(_index, layer) => editor.replaceLayer(layerId, layer)}
    onLayerIdChange={(_index, oldId, newId) => editor.replaceLayer(String(oldId), {...model.layer, id: String(newId)})}
    onLayerDestroy={() => editor.removeLayer(layerId)}
    onLayerCopy={() => editor.duplicateLayer(layerId)}
    onLayerVisibilityToggle={() => editor.toggleLayerVisibility(layerId)}
  />;
}
