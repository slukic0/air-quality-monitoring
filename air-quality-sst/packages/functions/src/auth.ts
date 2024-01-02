import { AuthHandler, GoogleAdapter, Session } from "sst/node/auth";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Table } from "sst/node/table";
import { StaticSite } from "sst/node/site";

const GOOGLE_CLIENT_ID =
  "921966491227-4qg7horhbq49gg7rbas1a9761l2q4p4c.apps.googleusercontent.com";

const REDIRECT_URL = process.env.IS_LOCAL ? "http://127.0.0.1:5173" : StaticSite.ReactSite.url;

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

        const ddb = new DynamoDBClient({});
        await ddb.send(
          new PutItemCommand({
            TableName: Table.Users.tableName,
            Item: marshall({
              userId: claims.sub,
              email: claims.email,
              picture: claims.picture,
              name: claims.given_name,
            }),
          })
        );

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
