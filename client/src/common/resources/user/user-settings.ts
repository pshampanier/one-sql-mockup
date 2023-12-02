import { serializable } from "../../util/serializable";

type Minimap = "show" | "hide" | "auto";
type RenderWhitespace = "all" | "none" | "boundary" | "selection" | "trailing";

class EditorSettings {
  @serializable("string", { format: /show|hide|auto/, trim: true })
  minimap: Minimap = "hide";

  @serializable("string", { format: /all|none|boundary|selection|trailing/, trim: true })
  renderWhitespace: RenderWhitespace = "all";

  getMonacoEditorSettings(): object {
    return {
      minimap: {
        enabled: this.minimap === "show" || this.minimap === "auto",
      },
      renderWhitespace: this.renderWhitespace,
    };
  }
}

type Theme = "light" | "dark";

export class UserSettings {
  @serializable("string", { format: /light|dark/, trim: true })
  theme: Theme = "light";

  @serializable("boolean")
  telemetry: boolean = true;

  @serializable("boolean")
  showRecentlyOpened: boolean = true;

  @serializable("boolean")
  showFavorites: boolean = true;

  @serializable("object", { factory: EditorSettings })
  editor: EditorSettings = new EditorSettings();
}
