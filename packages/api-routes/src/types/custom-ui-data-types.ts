import { type ArtifactKind } from "../schemas/artifact-schema.js";

export type CustomUIDataTypes = {
  "chat-created": { id: string };
  kind: { id: string; title: string; kind: ArtifactKind };
  "text-delta": string;
  "code-delta": string;
  finish: string;
};
