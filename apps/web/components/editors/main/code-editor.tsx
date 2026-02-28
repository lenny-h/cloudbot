"use client";

import { type EditorContent } from "@/contexts/editor-context";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { memo, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { syncEditorContentToLocalStorage } from "../helper-functions/sync-editor-content";

export const editableCompartment = new Compartment();

type EditorProps = {
  codeEditorRef: React.RefObject<EditorView | null>;
};

export const CodeEditor = memo(({ codeEditorRef: editorRef }: EditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [localStorageInput, setLocalStorageInput] =
    useLocalStorage<EditorContent>("code-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });

  useEffect(() => {
    console.log("Initializing code editor");

    if (containerRef.current && !editorRef.current) {
      const startState = EditorState.create({
        doc: localStorageInput.content,
        extensions: [
          basicSetup,
          python(),
          java(),
          cpp(),
          oneDark,
          editableCompartment.of(EditorView.editable.of(true)),
        ],
      });

      editorRef.current = new EditorView({
        state: startState,
        parent: containerRef.current,
      });
    }

    return () => {
      if (editorRef.current) {
        syncEditorContentToLocalStorage(
          "code",
          editorRef,
          setLocalStorageInput,
        );

        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="not-prose relative size-full text-sm" ref={containerRef} />
  );
});
