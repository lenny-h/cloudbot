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

import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { artifactSchema } from "../../schemas/artifact-schema.js";
import { type Bindings } from "../../types/bindings.js";
import { type CustomUIMessage } from "../../types/custom-ui-message.js";
import { generateUUID } from "../../utils/generate-uuid.js";
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from "../artifacts/artifact-server.js";

type CreateDocumentProps = {
  userId: string;
  dataStream: UIMessageStreamWriter<CustomUIMessage>;
  env: Bindings;
};

export const createDocument = ({
  userId,
  dataStream,
  env,
}: CreateDocumentProps) =>
  tool({
    description:
      "Create a document with the given title, kind, and description.",
    inputSchema: z.object({
      title: z.string().describe("The title of the document to create."),
      kind: z
        .enum(artifactKinds)
        .describe(
          `The kind of document to create. Supported kinds: ${artifactKinds.join(", ")}.`,
        ),
      description: z
        .string()
        .describe(
          "A detailed description of the content to generate. Be specific about structure, sections, styling preferences, etc.",
        ),
    }),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      kind: artifactSchema,
      message: z.string(),
    }),
    execute: async ({ title, kind }) => {
      const id = generateUUID();

      dataStream.write({
        type: "data-documentIdentifier",
        data: {
          id,
          title,
          kind,
        },
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        userId,
        env,
      });

      dataStream.write({
        type: "data-createFinish",
        data: kind,
        transient: true,
      });

      return {
        id,
        title,
        kind,
        message: "A document was created and is now visible to the user.",
      };
    },
  });
