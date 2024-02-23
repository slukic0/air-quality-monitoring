import { Table } from 'sst/node/table';
import { ApiHandler } from 'sst/node/api';
import { useSession } from 'sst/node/auth';
import { createJsonBody } from '@air-quality-sst/core/jsonUtil';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = ApiHandler(async () => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== 'user') {
    throw new Error('Not authenticated');
  }

  const params = {
    TableName: Table.Users.tableName,
    Key: { userId: session.properties.userID },
  };

  const { Item } = await dynamoDb.get(params).promise();

  return createJsonBody(200, Item);
});
