import { beforeEach, describe, test } from "./utils/fixtures";
import { HeadlessDriver } from "./headless-driver";

describe("headless core sample", () => {
  const {given, when, get, then} = new HeadlessDriver();

  beforeEach(async () => {
    given.trackPageErrors();
    await given.unavailableStorage();
    await when.demo();
    await then(get.elementByTestId("headless:status")).shouldContainText("repository adapter loaded");
  });

  test.afterEach(async () => {
    await then(get.pageErrors()).shouldDeepNestedInclude([]);
  });

  test("composes real Maputnik components inside the custom host", async () => {
    await then(get.elementByTestId("headless:editor")).shouldBeVisible();
    await then(get.elementByTestId("layer-list")).shouldBeVisible();
    await then(get.element(".maplibregl-canvas")).shouldHaveLength(1);
    await then(get.element("iframe")).shouldNotExist();
    await then(get.elementByTestId("headless:selected")).shouldContainText("background");
  });

  test("edits flow through the core and host-owned dirty state", async () => {
    await when.editBackground("#bb3355");
    await then(get.elementByTestId("headless:dirty")).shouldHaveText("Unsaved changes");
    await then(get.elementByTestId("headless:history")).shouldHaveText("History 2/2");
    await when.click("headless:save");
    await then(get.elementByTestId("headless:status")).shouldContainText("through the host repository adapter");
    await then(get.elementByTestId("headless:dirty")).shouldHaveText("Saved");
  });

  test("undo and redo are exposed through custom host controls", async () => {
    await when.editBackground("#bb3355");
    await when.click("headless:undo");
    await then(get.element("[name='background-color']")).shouldHaveValue("#e9ede5");
    await when.click("headless:redo");
    await then(get.element("[name='background-color']")).shouldHaveValue("#bb3355");
  });

  test("style library loading resets history and the clean baseline", async () => {
    await when.editBackground("#bb3355");
    await when.click("headless:library:vienna-night");
    await then(get.element(".workspace-heading h1")).shouldContainText("Night operations");
    await then(get.elementByTestId("headless:dirty")).shouldHaveText("Saved");
    await then(get.elementByTestId("headless:history")).shouldHaveText("History 1/1");
    await then(get.element("[name='background-color']")).shouldHaveValue("#152d36");
  });

  test("saved documents are read back through the repository adapter", async () => {
    await when.editBackground("#bb3355");
    await when.click("headless:save");
    await then(get.elementByTestId("headless:status")).shouldContainText("Saved");
    await when.click("headless:library:vienna-night");
    await then(get.element(".workspace-heading h1")).shouldContainText("Night operations");
    await when.click("headless:library:vienna-day");
    await then(get.element("[name='background-color']")).shouldHaveValue("#bb3355");
  });
});
