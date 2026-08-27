import type { StyleSpecification } from "../../../src/editor";

// Deliberately self-contained: editing and rendering need no tile service or key.
export const initialStyle: StyleSpecification = {
  version: 8,
  name: "Vienna · Daylight",
  center: [16.376, 48.211],
  zoom: 12.7,
  metadata: { "host:project": "React embed POC", "host:fixture": "illustrative geometry" },
  sources: {
    districts: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: { kind: "district" }, geometry: { type: "Polygon", coordinates: [[[16.34,48.196],[16.372,48.194],[16.384,48.218],[16.36,48.232],[16.34,48.196]]] } },
          { type: "Feature", properties: { kind: "park" }, geometry: { type: "Polygon", coordinates: [[[16.391,48.21],[16.416,48.217],[16.403,48.235],[16.382,48.222],[16.391,48.21]]] } },
          { type: "Feature", properties: { kind: "park" }, geometry: { type: "Polygon", coordinates: [[[16.351,48.208],[16.357,48.206],[16.363,48.216],[16.356,48.218],[16.351,48.208]]] } },
          { type: "Feature", properties: { kind: "water" }, geometry: { type: "LineString", coordinates: [[16.342,48.244],[16.357,48.23],[16.377,48.218],[16.391,48.199],[16.411,48.19]] } },
          { type: "Feature", properties: { kind: "road" }, geometry: { type: "LineString", coordinates: [[16.334,48.216],[16.36,48.212],[16.373,48.208],[16.407,48.205]] } },
          { type: "Feature", properties: { kind: "road" }, geometry: { type: "LineString", coordinates: [[16.364,48.192],[16.367,48.21],[16.37,48.23]] } },
          { type: "Feature", properties: { kind: "road" }, geometry: { type: "LineString", coordinates: [[16.355,48.203],[16.364,48.199],[16.377,48.203],[16.381,48.212],[16.374,48.217],[16.361,48.217],[16.355,48.203]] } },
          { type: "Feature", properties: { name: "Stephansplatz" }, geometry: { type: "Point", coordinates: [16.373,48.208] } },
          { type: "Feature", properties: { name: "Prater" }, geometry: { type: "Point", coordinates: [16.397,48.224] } },
        ],
      },
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#e9ede5" } },
    { id: "districts", type: "fill", source: "districts", filter: ["==", ["get", "kind"], "district"], paint: { "fill-color": "#d9ded2", "fill-outline-color": "#c2cbb9" } },
    { id: "parks", type: "fill", source: "districts", filter: ["==", ["get", "kind"], "park"], paint: { "fill-color": "#a7caaa", "fill-opacity": 0.85 } },
    { id: "water", type: "line", source: "districts", filter: ["==", ["get", "kind"], "water"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#89b6c9", "line-width": 20 } },
    { id: "roads", type: "line", source: "districts", filter: ["==", ["get", "kind"], "road"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": 5 } },
    { id: "places", type: "circle", source: "districts", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-color": "#305b4d", "circle-radius": 7, "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 } },
  ],
};

export const anotherStyle: StyleSpecification = {
  version: 8,
  name: "Midnight · Empty canvas",
  center: [16.376, 48.211],
  zoom: 0,
  metadata: { "host:project": "React embed POC" },
  sources: {},
  layers: [{ id: "night-background", type: "background", paint: { "background-color": "#152d36" } }],
};
