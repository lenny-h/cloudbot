import * as z from "zod";

export const artifactSchema = z.enum(["text", "code", "sheet"]);

export type ArtifactKind = z.infer<typeof artifactSchema>;
