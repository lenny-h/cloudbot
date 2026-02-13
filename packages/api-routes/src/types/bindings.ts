import {
  type Ai,
  type D1Database,
  type R2Bucket,
} from "@cloudflare/workers-types";

export type Bindings = {
  TEST_BUCKET: R2Bucket;
  YOUR_D1_DATABASE: D1Database;
  AI: Ai;
};
