import { drizzle } from "drizzle-orm/d1";

export const db = drizzle({ connection: process.env.BINDING_NAME });
