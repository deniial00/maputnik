// Browser test fixture only: not imported by the demo or its production build.
import { StrictMode, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Map } from "maplibre-gl";
import { MaputnikEditor, type MaputnikEditorHandle, type StyleSpecification } from "../../../src/editor";
import { initialStyle } from "../src/styles";

let removedMaps = 0;
const maps: Map[] = [];
const originalRemove = Map.prototype.remove;
Map.prototype.remove = function() { removedMaps++; return originalRemove.call(this); };
const originalSetStyle = Map.prototype.setStyle;
Map.prototype.setStyle = function(...args) { maps.push(this); return originalSetStyle.apply(this, args); };

export function Fixture() {
  const ref = useRef<MaputnikEditorHandle>(null);
  const [initial, setInitial] = useState(initialStyle);
  const [mounted, setMounted] = useState(true);
  const [callbackVersion, setCallbackVersion] = useState(1);
  const signals = useRef<number[]>([]);
  useLayoutEffect(() => {
    Object.assign(window, { embedTest: {
      getStyle: () => ref.current!.getStyle(),
      replaceAndRead: (value: StyleSpecification) => {
        ref.current!.setStyle(value);
        return ref.current!.getStyle();
      },
      verifyOwnership: (value: StyleSpecification) => {
        ref.current!.setStyle(value);
        value.layers.length = 0;
        const snapshot = ref.current!.getStyle();
        snapshot.layers.length = 0;
        return ref.current!.getStyle();
      },
      reset: () => ref.current!.reset(),
      setInitial,
      setMounted,
      setCallbackVersion,
      signals: () => signals.current,
      removedMaps: () => removedMaps,
      mapStyle: () => maps[maps.length - 1].getStyle(),
      mapLoaded: () => maps[maps.length - 1]?.isStyleLoaded() ?? false,
      hasRef: () => ref.current !== null,
    } });
  });
  return <div style={{height: 650}}>{mounted && <MaputnikEditor ref={ref} initialStyle={initial}
    onStyleChange={() => signals.current.push(callbackVersion)} />}</div>;
}

createRoot(document.getElementById("fixture")!).render(<StrictMode><Fixture /></StrictMode>);
