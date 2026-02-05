import * as z from "zod";

import { metadataSchema } from "../schemas/metadata-schema.js";

export type CustomUIMetadata = z.infer<typeof metadataSchema>;
