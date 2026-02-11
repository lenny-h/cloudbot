"use client";

import { type EditorContent } from "@/contexts/editor-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { exampleSetup } from "prosemirror-example-setup";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { memo, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { createCompletionPlugin } from "../completion-plugin";
import { buildDocumentFromContent } from "../helper-functions/build-document-from-content";
import { syncEditorContentToLocalStorage } from "../helper-functions/sync-editor-content";
import { plugins, textEditorSchema } from "../prosemirror-math/config";
import { mathTextSerializer } from "../prosemirror-math/utils/text-serializer";

import "../prosemirror-math/styles.css";

type EditorProps = {
  textEditorRef: React.RefObject<EditorView | null>;
};

export const TextEditor = memo(({ textEditorRef: editorRef }: EditorProps) => {
  const { sharedT } = useSharedTranslations();
  const containerRef = useRef<HTMLDivElement>(null);

  const [autocomplete] = useLocalStorage<{ text: boolean }>("autocomplete", {
    text: false,
  });
  const [localStorageInput, setLocalStorageInput] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });

  useEffect(() => {
    console.log("Initializing text editor");

    if (containerRef.current && !editorRef.current) {
      const startState = EditorState.create({
        doc: buildDocumentFromContent(localStorageInput.content),
        plugins: [
          ...exampleSetup({ schema: textEditorSchema, menuBar: false }),
          createCompletionPlugin(650, autocomplete.text, sharedT.apiCodes),
          ...plugins,
        ],
        schema: textEditorSchema,
      });

      editorRef.current = new EditorView(containerRef.current, {
        state: startState,
        clipboardTextSerializer: (slice) => {
          return mathTextSerializer.serializeSlice(slice);
        },
      });
    }

    return () => {
      if (editorRef.current) {
        syncEditorContentToLocalStorage(
          "text",
          editorRef,
          setLocalStorageInput,
        );

        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      localStorage.setItem(
        "autocomplete",
        JSON.stringify({
          ...autocomplete,
          text: autocomplete.text,
        }),
      );

      const newState = EditorState.create({
        doc: editorRef.current.state.doc,
        plugins: [
          ...exampleSetup({ schema: textEditorSchema, menuBar: false }),
          createCompletionPlugin(650, autocomplete.text, sharedT.apiCodes),
          ...plugins,
        ],
        schema: textEditorSchema,
      });

      editorRef.current.updateState(newState);
    }
  }, [autocomplete.text]);

  return (
    <div
      className="prose dark:prose-invert relative p-2"
      ref={containerRef}
      spellCheck={false}
    />
  );
});
