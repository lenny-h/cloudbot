import {
  type Ai,
  type D1Database,
  type R2Bucket,
} from "@cloudflare/workers-types";

export type Bindings = {
  CLOUDBOT_BUCKET: R2Bucket;
  CLOUDBOT_D1_DATABASE: D1Database;
  AI: Ai;
};
