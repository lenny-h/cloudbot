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

import { createLogger } from "@workspace/server/logger/logger.js";
import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { artifactSchema } from "../../schemas/artifact-schema.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { documentHandlersByArtifactKind } from "../artifacts/artifact-server.js";
import { getDocumentById } from "../queries/documents.js";

type UpdateDocumentProps = {
  userId: string;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
  env: Bindings;
};

const logger = createLogger("update-document");

export const updateDocument = ({
  userId,
  dataStream,
  env,
}: UpdateDocumentProps) =>
  tool({
    description: "Update a document with the given description.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the document to update"),
      description: z
        .string()
        .describe("The description of changes that need to be made"),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      kind: artifactSchema,
      message: z.string(),
    }),
    execute: async ({ id, description }) => {
      try {
        const document = await getDocumentById({ id });

        if (!document) {
          return {
            error: "Document not found",
          };
        }

        dataStream.write({
          type: "data-documentIdentifier",
          data: {
            id,
            title: document.title,
            kind: document.kind,
          },
          transient: true,
        });

        const documentHandler = documentHandlersByArtifactKind.find(
          (documentHandlerByArtifactKind) =>
            documentHandlerByArtifactKind.kind === document.kind,
        );

        if (!documentHandler) {
          throw new Error(
            `No document handler found for kind: ${document.kind}`,
          );
        }

        await documentHandler.onUpdateDocument({
          document,
          description,
          dataStream,
          userId,
          env,
        });

        dataStream.write({
          type: "data-updateFinish",
          data: document.kind,
          transient: true,
        });

        return {
          id,
          title: document.title,
          kind: document.kind,
          message: "The document has been updated successfully.",
        };
      } catch (error) {
        logger.error("Error in updateDocument tool", error);
        throw error;
      }
    },
  });
