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

import { artifactModelIdx } from "@workspace/api-routes/providers/models.js";
import {
  createDocumentPrompt,
  updateDocumentPrompt,
} from "@workspace/api-routes/providers/prompts.js";
import { getModel } from "@workspace/api-routes/providers/providers.js";
import { smoothStream, streamText } from "ai";
import { HTTPException } from "hono/http-exception";
import { createDocumentHandler } from "./artifact-server.js";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, description, dataStream, env }) => {
    let draftContent = "";

    const config = await getModel(env, artifactModelIdx);

    const { fullStream } = streamText({
      model: config.model,
      system: createDocumentPrompt("text"),
      prompt: description ? `${title}\n\n${description}` : title,
      experimental_transform: smoothStream({ chunking: "line" }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: "data-textDelta",
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, env }) => {
    if (!document.content)
      throw new HTTPException(500, { message: "INTERNAL_SERVER_ERROR" });

    let draftContent = "";

    const config = await getModel(env, artifactModelIdx);

    const { fullStream } = streamText({
      model: config.model,
      system: updateDocumentPrompt(document.content, "text"),
      prompt: description,
      experimental_transform: smoothStream({ chunking: "line" }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: "data-textDelta",
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
});
