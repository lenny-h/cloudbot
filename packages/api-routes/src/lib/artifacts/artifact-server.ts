// Copyright 2024 Vercel, Inc.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { type Document } from "@workspace/server/drizzle/schema.js";
import { type UIMessageStreamWriter } from "ai";
import { type ArtifactKind } from "../../schemas/artifact-schema.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { generateUUID } from "../../utils/generate-uuid.js";
import { saveDiff, saveDocument } from "../queries/documents.js";
import { codeDocumentHandler } from "./code-server.js";
// import { sheetDocumentHandler } from "./sheet-server.js";
import { textDocumentHandler } from "./text-server.js";

export type SaveDocumentProps = {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
};

export type CreateDocumentCallbackProps = {
  id: string;
  title: string;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
  userId: string;
  env: Bindings;
};

export type UpdateDocumentCallbackProps = {
  document: Document;
  description: string;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
  userId: string;
  env: Bindings;
};

export type DocumentHandler<T = ArtifactKind> = {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
};

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
        userId: args.userId,
        env: args.env,
      });

      if (args.userId) {
        await saveDocument({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.userId,
        });
      }

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
        userId: args.userId,
        env: args.env,
      });

      if (args.userId) {
        await saveDiff({
          id: generateUUID(),
          documentId: args.document.id,
          previousText: args.document.content || "",
          newText: draftContent,
          kind: config.kind,
          userId: args.userId,
        });
      }

      return;
    },
  };
}

/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
  // sheetDocumentHandler,
];

export const artifactKinds = ["text", "code"] as const; // Maybe add sheet later
