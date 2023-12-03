import "github-markdown-css/github-markdown.css";
import { editor as monacoEditor } from "monaco-editor";

import { User } from "@/resources/user/user";
import { Workspace } from "@/resources/workspace/workspace";
import { editors } from "@/resources/editors";

import React, { useEffect, useState, useRef } from "react";
import { WorkspacePage } from "@/stores/WorkspaceStore";

import MonacoEditor from "react-monaco-editor";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { IconButton } from "../core/IconButton";
import { PageLoader } from "../PageLoader";

import MarkdownIcon from "@/assets/markdown-file.svg?react";
import EditCommandIcon from "@/assets/edit-command.svg?react";
import PreviewCommandIcon from "@/assets/preview-command.svg?react";

const MarkdownEditor: React.FunctionComponent<{ page: WorkspacePage }> = ({ page }) => {
  console.log("Rendering MarkdownEditor");

  const [mode, setMode] = useState<"loading" | "preview" | "editor">("loading");
  const [content, setContent] = useState<string>("");

  const workspace = Workspace.current;

  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor>();

  // Options for the Monaco editor
  const options = {
    ...User.current.settings.editor.getMonacoEditorSettings(),
    automaticLayout: true,
  };

  function handleShowPreview() {
    setMode("preview");
    const value = editorRef.current?.getValue();
    setContent(value || "");
  }

  function handleShowEditor() {
    setMode("editor");
    editorRef.current && editorRef.current.focus();
  }

  useEffect(() => {
    if (mode === "loading") {
      console.log("MarkdownEditor: useEffect");
      setMode("loading");
      workspace.loadCollectionItem(page.itemId).then(([resource]) => {
        setContent(resource.asText());
        setMode("preview");
      });
    }
  }, [mode, workspace, page.itemId]);

  if (mode === "loading") {
    return <PageLoader />;
  } else {
    return (
      <>
        <div
          className={
            "markdown-body w-full h-full overflow-y-scroll relative " + (mode === "preview" ? "block" : "hidden")
          }
        >
          <IconButton className="absolute top-1 right-5 z-50" icon={EditCommandIcon} onClick={handleShowEditor} />
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>

        <div className={"relative w-full h-full " + (mode === "editor" ? "block" : "hidden")}>
          <IconButton className="absolute top-1 right-5 z-50" icon={PreviewCommandIcon} onClick={handleShowPreview} />
          <MonacoEditor
            className="relative w-full h-full"
            language="markdown"
            theme={"vs-" + User.current.settings.theme}
            value={content}
            options={options}
            editorDidMount={(editor) => {
              editorRef.current = editor;
              mode === "editor" && editor.focus();
            }}
          />
        </div>
      </>
    );
  }
};

editors.register({
  name: "Markdown",
  selector: /^README$|^CONTRIBUTING$|.*\.md$/,
  icon: MarkdownIcon,
  component: MarkdownEditor,
});

export default MarkdownEditor;
