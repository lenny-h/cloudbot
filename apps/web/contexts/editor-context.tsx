"use client";

import { type ArtifactKind } from "@workspace/api-routes/schemas/artifact-schema";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

export type EditorMode = "pdf" | ArtifactKind;
export type DocumentIdentifier = {
  id?: string;
  title: string;
};
export type EditorContent = DocumentIdentifier & {
  content: string;
};

interface EditorContextType {
  editorMode: EditorMode;
  setEditorMode: React.Dispatch<React.SetStateAction<EditorMode>>;
  textDocumentIdentifier: DocumentIdentifier;
  setTextDocumentIdentifier: React.Dispatch<
    React.SetStateAction<DocumentIdentifier>
  >;
  codeDocumentIdentifier: DocumentIdentifier;
  setCodeDocumentIdentifier: React.Dispatch<
    React.SetStateAction<DocumentIdentifier>
  >;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function EditorProvider({ children }: Props) {
  const [editorMode, setEditorMode] = useState<EditorMode>("text");
  const [textDocumentIdentifier, setTextDocumentIdentifier] =
    useState<DocumentIdentifier>({
      id: undefined,
      title: "",
    });
  const [codeDocumentIdentifier, setCodeDocumentIdentifier] =
    useState<DocumentIdentifier>({
      id: undefined,
      title: "",
    });

  return (
    <EditorContext.Provider
      value={{
        editorMode,
        setEditorMode,
        textDocumentIdentifier,
        setTextDocumentIdentifier,
        codeDocumentIdentifier,
        setCodeDocumentIdentifier,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextType {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within a EditorProvider");
  }
  return context;
}
