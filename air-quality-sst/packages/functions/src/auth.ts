import { AuthHandler, GoogleAdapter, Session } from "sst/node/auth";

const GOOGLE_CLIENT_ID =
  "921966491227-4qg7horhbq49gg7rbas1a9761l2q4p4c.apps.googleusercontent.com";

const REDIRECT_URL = "http://127.0.0.1:5173";

declare module "sst/node/auth" {
  export interface SessionTypes {
    user: {
      userID: string;
    };
  }
}

export const handler = AuthHandler({
  providers: {
    google: GoogleAdapter({
      mode: "oidc",
      clientID: GOOGLE_CLIENT_ID,
      onSuccess: async (tokenset) => {
        const claims = tokenset.claims();
        return Session.parameter({
          redirect: REDIRECT_URL,
          type: "user",
          properties: {
            userID: claims.sub,
          },
        });
      },
    }),
  },
});
