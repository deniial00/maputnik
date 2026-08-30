import { PlaywrightHelper } from "./playwright-helper";

export class HeadlessDriver {
  private helper = new PlaywrightHelper();
  then = this.helper.then;
  given = this.helper.given;
  when = {
    ...this.helper.when,
    upstream: () => this.helper.when.visit("http://127.0.0.1:5174/"),
    shadcn: () => this.helper.when.visit("http://127.0.0.1:5174/shadcn.html"),
    editBackground: async (color: string) => {
      await this.helper.when.fillByName("background-color", color);
      await this.helper.when.focus("layer-editor.layer-id.input");
    },
    pickShadcnBackground: async (color: string) => {
      await this.helper.when.fillByName("background-color-picker", color);
    },
  };
  get = this.helper.get;
}
