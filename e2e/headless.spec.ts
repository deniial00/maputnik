import { beforeEach, describe, test } from "./utils/fixtures";
import { HeadlessDriver } from "./headless-driver";

describe("headless sample with the upstream Maputnik layout", () => {
  const {given, when, get, then} = new HeadlessDriver();

  beforeEach(async () => {
    given.trackPageErrors();
    await given.unavailableStorage();
    await when.upstream();
    await then(get.elementByTestId("upstream:status")).shouldContainText("repository adapter loaded");
  });

  test.afterEach(async () => {
    await then(get.pageErrors()).shouldDeepNestedInclude([]);
  });

  test("uses the standard Maputnik layout and real editor components", async () => {
    await then(get.element(".maputnik-toolbar")).shouldBeVisible();
    await then(get.element(".maputnik-layout-list")).shouldBeVisible();
    await then(get.element(".maputnik-layout-drawer")).shouldBeVisible();
    await then(get.elementByTestId("layer-list")).shouldBeVisible();
    await then(get.element(".maplibregl-canvas")).shouldHaveLength(1);
    await then(get.element("iframe")).shouldNotExist();
    await then(get.elementByTestId("upstream:selected")).shouldContainText("background");
  });

  test("edits, undo, redo, and save flow through the headless core", async () => {
    await when.editBackground("#bb3355");
    await then(get.elementByTestId("upstream:dirty")).shouldHaveText("Unsaved changes");
    await then(get.elementByTestId("upstream:history")).shouldHaveText("History 2/2");
    await when.click("upstream:undo");
    await then(get.element("[name='background-color']")).shouldHaveValue("#e9ede5");
    await when.click("upstream:redo");
    await then(get.element("[name='background-color']")).shouldHaveValue("#bb3355");
    await when.click("upstream:save");
    await then(get.elementByTestId("upstream:status")).shouldContainText("through the host repository adapter");
    await then(get.elementByTestId("upstream:dirty")).shouldContainText("Saved");
  });

  test("opens repository styles and resets the clean history baseline", async () => {
    await when.editBackground("#bb3355");
    await when.select("upstream:library", "vienna-night");
    await then(get.elementByTestId("upstream:dirty")).shouldContainText("Saved");
    await then(get.elementByTestId("upstream:history")).shouldHaveText("History 1/1");
    await then(get.element("[name='background-color']")).shouldHaveValue("#152d36");
  });
});

describe("headless sample with focused shadcn composition", () => {
  const {given, when, get, then} = new HeadlessDriver();

  beforeEach(async () => {
    given.trackPageErrors();
    await given.unavailableStorage();
    await when.shadcn();
    await then(get.elementByTestId("shadcn:status")).shouldContainText("repository adapter loaded");
  });

  test.afterEach(async () => {
    await then(get.pageErrors()).shouldDeepNestedInclude([]);
  });

  test("uses shadcn fields instead of the upstream property editor", async () => {
    await then(get.element("[data-slot='button']")).shouldExist();
    await then(get.element("[data-slot='card']")).shouldExist();
    await then(get.element("[data-slot='badge']")).shouldExist();
    await then(get.element("[data-slot='tabs']")).shouldExist();
    await then(get.element("[data-slot='input']")).shouldExist();
    await then(get.element("[data-slot='label']")).shouldExist();
    await then(get.element("[data-slot='textarea']")).shouldExist();
    await then(get.element("[data-slot='select-trigger']")).shouldExist();
    await then(get.element("[data-slot='separator']")).shouldExist();
    await then(get.elementByTestId("shadcn:layer-editor")).shouldBeVisible();
    await then(get.element(".maputnik-layer-editor")).shouldNotExist();
    await then(get.element(".maplibregl-canvas")).shouldHaveLength(1);
    await then(get.element("iframe")).shouldNotExist();
  });

  test("custom layer controls select the headless shadcn property editor", async () => {
    await when.click("shadcn:layer:parks");
    await then(get.elementByTestId("shadcn:selected")).shouldContainText("parks");
    await then(get.elementByTestId("shadcn:layer-heading")).shouldContainText("parks");
    await then(get.element("[data-slot='switch']")).shouldExist();
    await when.click("shadcn:input:fill-antialias");
    await then(get.elementByTestId("shadcn:dirty")).shouldHaveText("Unsaved changes");
    await when.click("shadcn:tab:json");
    await then(get.elementByTestId("shadcn:json")).shouldContainText("\"fill-antialias\": false");
  });

  test("shares the same edit, history, and repository save behavior", async () => {
    await when.editShadcnBackground("#bb3355");
    await then(get.elementByTestId("shadcn:dirty")).shouldHaveText("Unsaved changes");
    await then(get.elementByTestId("shadcn:history")).shouldHaveText("History 2/2");
    await when.click("shadcn:save");
    await then(get.elementByTestId("shadcn:status")).shouldContainText("through the host repository adapter");
    await then(get.elementByTestId("shadcn:dirty")).shouldHaveText("Saved");
  });

  test("exposes the live headless style through the shadcn tabs", async () => {
    await when.click("shadcn:tab:json");
    await then(get.elementByTestId("shadcn:json")).shouldContainText("\"background-color\": \"#e9ede5\"");
    await then(get.elementByTestId("shadcn:json")).shouldContainText("\"id\": \"water\"");
  });
});
