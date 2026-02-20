import {
  type Ai,
  type D1Database,
  type R2Bucket,
} from "@cloudflare/workers-types";

export type Bindings = {
  cloudbot-bucket: R2Bucket;
  cloudbot-db: D1Database;
  AI: Ai;
};
