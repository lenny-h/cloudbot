import {
  type Ai,
  type D1Database,
  type R2Bucket,
} from "@cloudflare/workers-types";

export type Bindings = {
  CLOUDBOT_BUCKET: R2Bucket;
  CLOUDBOT_DB: D1Database;
  AI: Ai;
};
