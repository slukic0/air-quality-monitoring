import { AuthHandler, GoogleAdapter, Session } from 'sst/node/auth';
import { Table } from 'sst/node/table';
import { StaticSite } from 'sst/node/site';
import AWS from 'aws-sdk';

const GOOGLE_CLIENT_ID =
  '921966491227-4qg7horhbq49gg7rbas1a9761l2q4p4c.apps.googleusercontent.com';

const REDIRECT_URL = process.env.IS_LOCAL ? 'http://127.0.0.1:5173' : StaticSite.ReactSite.url;

declare module 'sst/node/auth' {
  export interface SessionTypes {
    user: {
      userID: string
    }
  }
}

export const handler = AuthHandler({
  providers: {
    google: GoogleAdapter({
      mode: 'oidc',
      clientID: GOOGLE_CLIENT_ID,
      onSuccess: async (tokenset) => {
        const claims = tokenset.claims();
        const dynamoDb = new AWS.DynamoDB.DocumentClient();

        const params = {
          TableName: Table.Users.tableName,
          Key: { userId: claims.sub },
          UpdateExpression: 'SET email = :email, emailFirstLetter = :emailFirstLetter, picture = :picture, #givenName = :givenName',
          ExpressionAttributeValues: {
            ':email': claims.email,
            ':picture': claims.picture,
            ':givenName': claims.given_name,
            ':emailFirstLetter': claims.email?.at(0),
          },
          ExpressionAttributeNames: {
            '#givenName': 'name',
          },
        };

        await dynamoDb.update(params).promise();

        return Session.parameter({
          redirect: REDIRECT_URL,
          type: 'user',
          properties: {
            userID: claims.sub,
          },
        });
      },
    }),
  },
});
