import * as z from "zod";
import { uuidSchema } from "./uuid-schema.js";

export const createUuidArraySchema = (maxItems: number) =>
  z
    .string()
    .transform((str) => str.split(",").filter(Boolean))
    .pipe(
      z
        .array(uuidSchema)
        .min(1, { message: "Array must contain at least one UUID" })
        .max(maxItems, {
          message: `Array must contain at most ${maxItems} UUIDs`,
        }),
    );
