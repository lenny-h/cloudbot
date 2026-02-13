import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.js";

export const db = drizzle({ connection: process.env.BINDING_NAME }, { schema });
