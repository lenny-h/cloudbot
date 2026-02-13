import { type Auth } from "@workspace/server/auth-server.js";

export type Variables = {
  user: Auth['$Infer']['Session']['user'];
};
