import {
  type Ai,
  type D1Database,
  type R2Bucket,
} from "@cloudflare/workers-types";

export type Bindings = {
  cloudbot_bucket: R2Bucket;
  cloudbot_db: D1Database;
  AI: Ai;
};
