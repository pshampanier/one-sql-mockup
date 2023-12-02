import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// @ts-expect-error MonacoEnvironment is not defined
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    switch (label) {
      case "json": {
        return new jsonWorker();
      }
      case "css":
      case "scss":
      case "less": {
        return new cssWorker();
      }
      case "html":
      case "markdown": {
        return new htmlWorker();
      }
      case "typescript":
      case "javascript": {
        return new tsWorker();
      }
      default: {
        return new editorWorker();
      }
    }
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
