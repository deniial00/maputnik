import { beforeEach, describe, test } from "./utils/fixtures";
import { EmbedDriver } from "./embed-driver";
import { initialStyle, anotherStyle } from "../examples/react-embed/src/styles";

describe("embedded API in a foreign React root", () => {
  const {given, when, get, then} = new EmbedDriver();
  test.afterEach(async () => {
    await then(get.pageErrors()).shouldDeepNestedInclude([]);
  });
  beforeEach(async () => {
    given.trackPageErrors();
    await given.unavailableStorage();
    await when.fixture();
    await then(get.hasRef()).shouldEqual(true);
    await then(get.mapLoaded()).shouldEqual(true);
  });

  test("loads the complete initial style without iframe or storage", async () => {
    await then(get.style()).shouldDeepNestedInclude(initialStyle);
    await then(get.signals()).shouldDeepNestedInclude([]);
    await then(get.element("iframe")).shouldNotExist();
  });

  test("setStyle is immediately readable and clears old sources/layers", async () => {
    await then(await when.replace(anotherStyle)).shouldDeepNestedInclude(anotherStyle);
    await then(get.mapStyle()).shouldDeepNestedInclude({layers: anotherStyle.layers, sources: {}});
    await then(get.signals()).shouldDeepNestedInclude([1]);
  });

  test("input and returned snapshots cannot mutate internal state", async () => {
    await then(await when.ownership(anotherStyle)).shouldDeepNestedInclude(anotherStyle);
  });

  test("initialStyle changes do not replace the document or reset baseline", async () => {
    await when.initial(anotherStyle);
    await then(get.style()).shouldDeepNestedInclude(initialStyle);
    await when.replace(anotherStyle);
    await when.reset();
    await then(get.style()).shouldDeepNestedInclude(initialStyle);
  });

  test("notifies the latest callback and suppresses identical replacements", async () => {
    await when.callback(2);
    await when.replace(anotherStyle);
    await when.replace(anotherStyle);
    await then(get.signals()).shouldDeepNestedInclude([2]);
  });

  test("reset restores the captured initial style", async () => {
    await when.replace(anotherStyle);
    await when.reset();
    await then(get.style()).shouldDeepNestedInclude(initialStyle);
    await then(get.signals()).shouldDeepNestedInclude([1, 1]);
  });

  test("paint edits update the real MapLibre style and can be undone", async () => {
    await when.editBackground();
    await then(get.mapStyle()).shouldDeepNestedInclude({layers: [
      {...initialStyle.layers[0], paint: {"background-color": "#bb3355"}}, ...initialStyle.layers.slice(1),
    ]});
    await when.focus("embedded:editor");
    await when.typeKeys(process.platform === "darwin" ? "{meta}z" : "{ctrl}z");
    await then(get.style()).shouldDeepNestedInclude(initialStyle);
    await then(get.signals()).shouldDeepNestedInclude([1, 1]);
  });

  test("setStyle establishes a new undo baseline", async () => {
    await when.editBackground();
    await when.replace(anotherStyle);
    await when.focus("embedded:editor");
    await when.typeKeys(process.platform === "darwin" ? "{meta}z" : "{ctrl}z");
    await then(get.style()).shouldDeepNestedInclude(anotherStyle);
  });

  test("MapLibre loads a URL source without a Maputnik backend", async () => {
    const url = "https://example.test/points.json";
    await given.interceptAndMockResponse({url, alias: "remote-source", response: {
      type: "FeatureCollection", features: [{type: "Feature", properties: {}, geometry: {type: "Point", coordinates: [0, 0]}}],
    }});
    const style = {...anotherStyle, sources: {remote: {type: "geojson" as const, data: url}},
      layers: [{id: "remote-points", type: "circle" as const, source: "remote"}]};
    await when.replace(style);
    await when.waitForResponse("remote-source");
    await then(get.mapLoaded()).shouldEqual(true);
    await then(get.style()).shouldDeepNestedInclude(style);
  });

  test("does not change the host URL when selecting or replacing styles", async () => {
    await when.click("layer-list-item:water");
    await when.replace(anotherStyle);
    await then(get.location()).shouldEqual("http://127.0.0.1:5173/tests/api.html?host=keep#host-route");
  });

  test("ignores pending source metadata after replacing the document", async () => {
    await given.interceptAndMockResponse({url: /https:\/\/example.test\/slow-.*\.json/,
      alias: "slow-metadata", delayMs: 500,
      response: {tilejson: "3.0.0", tiles: [], vector_layers: []},
    });
    await when.replace({...anotherStyle, sources: {
      first: {type: "vector", url: "https://example.test/slow-one.json"},
      second: {type: "vector", url: "https://example.test/slow-two.json"},
    }});
    await when.waitForResponse("slow-metadata");
    await when.replace(anotherStyle);
    // Allow the deliberately delayed response to finish after replacement.
    await when.wait(800);
    await then(get.style()).shouldDeepNestedInclude(anotherStyle);
    await then(get.mapStyle()).shouldDeepNestedInclude({layers: anotherStyle.layers, sources: {}});
  });

  test("destroys maps and CodeMirror on unmount, including StrictMode", async () => {
    await then(get.removedMaps()).shouldEqual(1);
    await then(get.element(".cm-editor")).shouldHaveLength(1);
    await when.mount(false);
    await then(get.hasRef()).shouldEqual(false);
    await then(get.removedMaps()).shouldEqual(2);
    await then(get.element("canvas, .cm-editor")).shouldNotExist();
    // The upstream inspector schedules a 1 s delayed render.
    await when.wait(1200);
    await when.mount(true);
    await then(get.removedMaps()).shouldEqual(3);
    await then(get.element(".maplibregl-canvas")).shouldHaveLength(1);
    await then(get.element(".cm-editor")).shouldHaveLength(1);
    await then(get.mapLoaded()).shouldEqual(true);
  });
});

describe("embedded editor UI in the host demo", () => {
  const {given, when, get, then} = new EmbedDriver();
  test.afterEach(async () => {
    await then(get.pageErrors()).shouldDeepNestedInclude([]);
  });
  beforeEach(async () => {
    given.trackPageErrors();
    await given.unavailableStorage();
    await when.demo();
    await then(get.elementByTestId("maplibre:ctrl-zoom")).shouldContainText("12.70");
  });

  test("paint edits reach the host snapshot and dirty state", async () => {
    await when.editBackground();
    await then(get.elementByTestId("host:dirty")).shouldContainText("Ungespeicherte");
    await when.click("host:save");
    await then(get.snapshot()).shouldDeepNestedInclude({...initialStyle, layers: [
      {...initialStyle.layers[0], paint: {"background-color": "#bb3355"}}, ...initialStyle.layers.slice(1),
    ]});
    await then(get.elementByTestId("host:dirty")).shouldContainText("Keine offenen");
  });

  test("layout visibility edits reach the host", async () => {
    await when.checkRadio("None");
    await when.click("host:read");
    await then(get.snapshot()).shouldDeepNestedInclude({...initialStyle, layers: [
      {...initialStyle.layers[0], layout: {visibility: "none"}}, ...initialStyle.layers.slice(1),
    ]});
  });

  test("existing add-layer modal creates a real layer", async () => {
    await when.clickButtonByName("Add Layer");
    await when.selectWithin("add-layer.layer-type", "background");
    await when.setValue("add-layer.layer-id.input", "extra-background");
    await when.click("add-layer");
    await when.click("host:read");
    await then(get.snapshot()).shouldDeepNestedInclude({...initialStyle, layers: [
      ...initialStyle.layers, {id: "extra-background", type: "background"},
    ]});
  });

  test("source dialog stays inside the editor without locking the body", async () => {
    await when.click("nav:sources");
    await then(get.element(".maputnik-editor .maputnik-modal")).shouldBeVisible();
    await then(get.element(".maputnik-editor .maputnik-modal")).shouldContainText("districts");
    await then(get.element("body")).shouldHaveCss("overflow", "visible");
  });

  test("host inputs keep their styles and do not trigger editor shortcuts", async () => {
    await when.setValue("host:input", "host data");
    await when.typeKeys("{ctrl}z");
    await when.typeText("osd?");
    await then(get.element(".maputnik-modal")).shouldNotExist();
    await then(get.elementByTestId("host:changes")).shouldHaveText("0 Signale");
    await then(get.element("body")).shouldHaveCss("overflow", "visible");
    await then(get.element(".host-intro h1")).shouldHaveCss("font-size", "31px");
  });
});
