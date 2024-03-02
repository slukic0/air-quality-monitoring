import { DynamoDB } from 'aws-sdk';
import { Table } from 'sst/node/table';
import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ApiHandler, usePathParams } from 'sst/node/api';
import { createJsonMessage, createJsonBody } from '@air-quality-sst/core/jsonUtil';
import { jwtErrorHandlingMiddleware, useMiddewares } from '@air-quality-sst/core/middlewareUtil';
import { useSession } from 'sst/node/auth';
import httpErrorHandler from '@middy/http-error-handler';
import createGetUserGetItemParams from '@air-quality-sst/core/src/dynamo/createGetUserGetItemParams';

const dynamoDb = new DynamoDB.DocumentClient();

/**
 *  List users by specifiying the start of their email address
 */
const getUsersByEmailHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();
  const { emailString } = usePathParams();

  // Check user is authenticated
  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  if (typeof emailString !== 'string') {
    return createJsonMessage(400, 'emailString is required');
  }

  const queryParams = {
    TableName: Table.Users.tableName,
    IndexName: 'emailLetterIndex',
    KeyConditionExpression: 'emailFirstLetter = :emailFirstLetter',
    FilterExpression: 'begins_with(email, :emailString)',
    ExpressionAttributeValues: {
      ':emailFirstLetter': emailString.at(0),
      ':emailString': emailString,
    },
    ProjectionExpression: 'userId, email, #givenName',
    ExpressionAttributeNames: {
      '#givenName': 'name',
    },
  };
  const { Items } = await dynamoDb.query(queryParams).promise();

  return createJsonBody(201, Items);
});

const getUserHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();
  const { userId } = usePathParams();

  // Check user is authenticated
  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  if (typeof userId !== 'string') {
    return createJsonMessage(400, 'emailString is required');
  }

  const { Item } = await dynamoDb.get(createGetUserGetItemParams(userId)).promise();

  if (Item) {
    if (!Item.authorizedDevices) {
      Item.authorizedDevices = [];
    }
    if (!Item.adminDevices) {
      Item.adminDevices = [];
    }
  }

  return createJsonBody(201, Item);
});

export const getUsersByEmail = useMiddewares(getUsersByEmailHandler, [httpErrorHandler, jwtErrorHandlingMiddleware]);
export const getUser = useMiddewares(getUserHandler, [httpErrorHandler, jwtErrorHandlingMiddleware]);
