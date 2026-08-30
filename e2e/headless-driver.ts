import { PlaywrightHelper } from "./playwright-helper";

export class HeadlessDriver {
  private helper = new PlaywrightHelper();
  then = this.helper.then;
  given = this.helper.given;
  when = {
    ...this.helper.when,
    demo: () => this.helper.when.visit("http://127.0.0.1:5174/"),
    editBackground: async (color: string) => {
      await this.helper.when.fillByName("background-color", color);
      await this.helper.when.focus("layer-editor.layer-id.input");
    },
  };
  get = this.helper.get;
}
