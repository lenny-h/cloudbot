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
  documentIdentifier: DocumentIdentifier;
  setDocumentIdentifier: React.Dispatch<
    React.SetStateAction<DocumentIdentifier>
  >;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function EditorProvider({ children }: Props) {
  const [editorMode, setEditorMode] = useState<EditorMode>("text");
  const [documentIdentifier, setDocumentIdentifier] =
    useState<DocumentIdentifier>({
      id: undefined,
      title: "",
    });

  return (
    <EditorContext.Provider
      value={{
        editorMode,
        setEditorMode,
        documentIdentifier,
        setDocumentIdentifier,
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
