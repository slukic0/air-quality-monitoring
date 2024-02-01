import AWS from 'aws-sdk';
import { Table } from 'sst/node/table';
import { type APIGatewayProxyHandlerV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiHandler, usePathParams, useQueryParams } from 'sst/node/api';
import { createJsonMessage, createJsonBody } from '@air-quality-sst/core/jsonUtil';
import { jwtErrorHandlingMiddleware, useMiddewares } from '@air-quality-sst/core/middlewareUtil';
import { stringToTimestampMilliseconds } from '@air-quality-sst/core/stringUtil';
import { useSession } from 'sst/node/auth';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * Put a sensorData item into the database
 */
const createDataHandler: APIGatewayProxyHandlerV2 = async (event: any): Promise<APIGatewayProxyResultV2> => {
  const { deviceId, recordedTimestamp } = event.body;
  if (typeof (deviceId) !== 'string' || typeof (recordedTimestamp) !== 'number') {
    return createJsonMessage(400, 'Invalid Parameter');
  }

  const params = {
    TableName: Table.SensorData.tableName,
    Item: event.body,
  };

  await dynamoDb.put(params).promise();

  return createJsonBody(201, params.Item);
};

/**
 * Get sensor data from a given device.
 * Only returns records newer than the recordedTimestamp if it is provided.
 * The deviceId is a path param and the recordedTimestamp is a query param.
 *
 * @returns 403 if user is not authorized
 * @returns 200 for success
 */
const getDataHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();
  const { deviceId } = usePathParams();
  const { recordedTimestampStart, recordedTimestampEnd } = useQueryParams();

  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  if (!deviceId) {
    return createJsonMessage(400, 'deviceId is required');
  }

  // Convert recordedTimestamps to numbers
  let recordedTimestampStartNumber = null; let recordedTimestampEndNumber = null;
  if (recordedTimestampStart) {
    try {
      recordedTimestampStartNumber = stringToTimestampMilliseconds(recordedTimestampStart);
    } catch {
      return createJsonMessage(400, 'recordedTimestampStart must be a valid timestamp!');
    }
  }
  if (recordedTimestampEnd) {
    try {
      recordedTimestampEndNumber = stringToTimestampMilliseconds(recordedTimestampEnd);
    } catch {
      return createJsonMessage(400, 'recordedTimestampEnd must be a valid timestamp!');
    }
  }

  // Check if user is allowed to read data for this device
  const getParams = {
    TableName: Table.DeviceAdmins.tableName,
    Key: { deviceId },
  };
  const { Item: device } = await dynamoDb.get(getParams).promise();

  const authorizedUsers = device?.authorizedUsers?.values;
  const deviceAdmin = device?.adminId;
  const userId = session.properties.userID;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const isAuthorizedUser = !!authorizedUsers && Object.values(authorizedUsers).includes(userId);
  const isDeviceAdmin = userId === deviceAdmin;

  if (!isAuthorizedUser && !isDeviceAdmin) {
    return createJsonMessage(403, 'Forbidden');
  }

  // Get sensor data for this device
  let KeyConditionExpression = 'deviceId = :hkey';
  if (recordedTimestampStartNumber && recordedTimestampEndNumber) {
    KeyConditionExpression += ' AND recordedTimestamp BETWEEN :recordedTimestampStart AND :recordedTimestampEnd';
  } else if (recordedTimestampStartNumber) {
    KeyConditionExpression += ' AND recordedTimestamp >= :recordedTimestampStart';
  } else if (recordedTimestampEndNumber) {
    KeyConditionExpression += ' AND recordedTimestamp <= :recordedTimestampEnd';
  }

  const ExpressionAttributeValues = {
    ':hkey': deviceId,
    ...(recordedTimestampStartNumber && { ':recordedTimestampStart': recordedTimestampStartNumber }),
    ...(recordedTimestampEndNumber && { ':recordedTimestampEnd': recordedTimestampEndNumber }),
  };

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property
  const params = {
    TableName: Table.SensorData.tableName,
    KeyConditionExpression,
    ExpressionAttributeValues,
  };

  const results = await dynamoDb.query(params).promise();

  return createJsonBody(200, results.Items);
});

export const createData = useMiddewares(createDataHandler, [httpErrorHandler, jsonBodyParser]);
export const getData = useMiddewares(getDataHandler, [httpErrorHandler, jwtErrorHandlingMiddleware]);
