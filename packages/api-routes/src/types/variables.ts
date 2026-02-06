import { auth } from "@workspace/server/auth-server.js";

export type Variables = {
  user: typeof auth.$Infer.Session.user;
};
