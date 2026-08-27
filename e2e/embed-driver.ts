import { PlaywrightHelper } from "./playwright-helper";
import type { MaputnikEditorHandle } from "../src/editor/types";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

type TestApi = {
  getStyle: MaputnikEditorHandle["getStyle"];
  replaceAndRead(style: StyleSpecification): StyleSpecification;
  verifyOwnership(style: StyleSpecification): StyleSpecification;
  reset(): void;
  setInitial(style: StyleSpecification): void;
  setMounted(value: boolean): void;
  setCallbackVersion(value: number): void;
  signals(): number[];
  removedMaps(): number;
  mapStyle(): StyleSpecification;
  mapLoaded(): boolean;
  hasRef(): boolean;
};
declare global { interface Window { embedTest: TestApi } }

export class EmbedDriver {
  private helper = new PlaywrightHelper();
  then = this.helper.then;
  given = this.helper.given;
  when = {
    ...this.helper.when,
    demo: () => this.helper.when.visit("http://127.0.0.1:5173/"),
    fixture: () => this.helper.when.visit("http://127.0.0.1:5173/tests/api.html?host=keep#host-route"),
    replace: (style: StyleSpecification) => this.helper.when.evaluate(value => window.embedTest.replaceAndRead(value), style),
    ownership: (style: StyleSpecification) => this.helper.when.evaluate(value => window.embedTest.verifyOwnership(value), style),
    reset: () => this.helper.when.evaluate(() => window.embedTest.reset(), undefined),
    initial: (style: StyleSpecification) => this.helper.when.evaluate(value => window.embedTest.setInitial(value), style),
    mount: (value: boolean) => this.helper.when.evaluate(value => window.embedTest.setMounted(value), value),
    callback: (value: number) => this.helper.when.evaluate(value => window.embedTest.setCallbackVersion(value), value),
    editBackground: async () => {
      await this.helper.when.fillByName("background-color", "#bb3355");
      await this.helper.when.focus("layer-editor.layer-id.input");
    },
  };
  get = {
    ...this.helper.get,
    style: () => this.helper.get.pageValue(() => window.embedTest.getStyle()),
    mapStyle: () => this.helper.get.pageValue(() => window.embedTest.mapStyle()),
    mapLoaded: () => this.helper.get.pageValue(() => window.embedTest.mapLoaded()),
    signals: () => this.helper.get.pageValue(() => window.embedTest.signals()),
    removedMaps: () => this.helper.get.pageValue(() => window.embedTest.removedMaps()),
    hasRef: () => this.helper.get.pageValue(() => window.embedTest?.hasRef() ?? false),
    snapshot: () => this.helper.get.elementsText("host:snapshot").then(text => JSON.parse(text)),
  };
}
