import * as z from "zod";

export const artifactSchema = z.enum(["text", "code"]); // Maybe add sheet later

export type ArtifactKind = z.infer<typeof artifactSchema>;
