import { useEffect, useState } from "react";
import type { LngLat, MapOptions, StyleSpecification } from "maplibre-gl";
import { MapMaplibreGl } from "../../components/MapMaplibreGl";
import { replaceAccessTokens } from "../../libs/style";
import { useEditorActions, useEditorSelector } from "../react";

type HeadlessMapPreviewProps = {
  options?: Partial<MapOptions>;
  transformStyle?: (style: StyleSpecification) => StyleSpecification;
};

export function HeadlessMapPreview({options, transformStyle}: HeadlessMapPreviewProps) {
  const editor = useEditorActions();
  const model = useEditorSelector(state => ({style: state.style, selectedLayerId: state.selectedLayerId}));
  const [mapView, setMapView] = useState<{
    zoom: number;
    center: {lng: number; lat: number} | LngLat;
    _from: "map" | "app";
  }>({
    zoom: model.style.zoom ?? 0,
    center: {lng: model.style.center?.[0] ?? 0, lat: model.style.center?.[1] ?? 0},
    _from: "app" as const,
  });
  useEffect(() => {
    setMapView({
      zoom: model.style.zoom ?? 0,
      center: {lng: model.style.center?.[0] ?? 0, lat: model.style.center?.[1] ?? 0},
      _from: "app",
    });
  }, [model.style.center, model.style.zoom]);
  const selected = model.style.layers.find(layer => layer.id === model.selectedLayerId);
  return <div className="maputnik-map__container" data-wd-key="headless:map-container">
    <MapMaplibreGl
      mapStyle={model.style}
      mapView={mapView}
      onChange={setMapView}
      onLayerSelect={index => editor.selectLayer(model.style.layers[index]?.id ?? null)}
      inspectModeEnabled={false}
      highlightedLayer={selected}
      options={{...options, hash: false}}
      replaceAccessTokens={transformStyle ?? (style => replaceAccessTokens(style, {allowFallback: true}))}
    />
  </div>;
}
