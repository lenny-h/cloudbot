import * as schema from "./schema.js";

import {
  type Ai,
  type D1Database,
  type R2Bucket,
} from "@cloudflare/workers-types";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

interface Env {
  TEST_BUCKET: R2Bucket;
  YOUR_D1_DATABASE: D1Database;
  AI: Ai;
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

export function db(): Db {
  if (!_db) {
    _db = drizzle((env as Env).YOUR_D1_DATABASE, { schema });
  }
  return _db;
}
