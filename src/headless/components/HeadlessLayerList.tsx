import { LayerList } from "../../components/LayerList";
import { useEditorActions, useEditorSelector } from "../react";
import { toEditorSources, toMappedErrors } from "./adapters";

export function HeadlessLayerList() {
  const editor = useEditorActions();
  const model = useEditorSelector(state => ({
    layers: state.style.layers,
    sources: toEditorSources(state.style),
    errors: toMappedErrors(state.validation),
    selectedLayerIndex: Math.max(0, state.style.layers.findIndex(layer => layer.id === state.selectedLayerId)),
  }));
  return <LayerList
    layers={model.layers}
    sources={model.sources}
    errors={model.errors}
    selectedLayerIndex={model.selectedLayerIndex}
    onLayerSelect={index => editor.selectLayer(model.layers[index]?.id ?? null)}
    onLayersChange={layers => editor.setLayers(layers)}
    onMoveLayer={move => editor.moveLayer(move.oldIndex, move.newIndex)}
    onLayerDestroy={index => editor.removeLayer(model.layers[Number(index)].id)}
    onLayerCopy={index => editor.duplicateLayer(model.layers[Number(index)].id)}
    onLayerVisibilityToggle={index => editor.toggleLayerVisibility(model.layers[Number(index)].id)}
  />;
}
