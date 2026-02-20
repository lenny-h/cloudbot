import * as z from "zod";

export const prefixSchema = z.string().min(1).max(128);
