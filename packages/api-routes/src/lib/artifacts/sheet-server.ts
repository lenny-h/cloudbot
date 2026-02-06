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

import { getArtifactModel } from "@/lib/ai/providers";
import { streamText } from "ai";
import { sheetPrompt, updateDocumentPrompt } from "../../providers/prompts.js";
import { createDocumentHandler } from "./artifact-server.js";

export const sheetDocumentHandler = createDocumentHandler<"sheet">({
  kind: "sheet",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: getArtifactModel(),
      system: sheetPrompt,
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text: csv } = delta;

        if (csv) {
          dataStream.write({
            type: "data-sheetDelta",
            data: csv,
            transient: true,
          });

          draftContent = csv;
        }
      }
    }

    dataStream.write({
      type: "data-sheetDelta",
      data: draftContent,
      transient: true,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: getArtifactModel(),
      system: updateDocumentPrompt(document.content, "sheet"),
      prompt: description,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text: csv } = delta;

        if (csv) {
          dataStream.write({
            type: "data-sheetDelta",
            data: csv,
            transient: true,
          });

          draftContent = csv;
        }
      }
    }

    return draftContent;
  },
});
