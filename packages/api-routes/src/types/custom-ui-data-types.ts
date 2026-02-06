import { type z } from "zod";
import { dataSchemas } from "../schemas/data-schemas.js";

export type CustomUIDataTypes = {
  [K in keyof typeof dataSchemas]: z.infer<(typeof dataSchemas)[K]>;
};
