import { DynamoDB } from 'aws-sdk';
import { Table } from 'sst/node/table';
import { type APIGatewayProxyHandlerV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiHandler, usePathParams, useQueryParams } from 'sst/node/api';
import { createJsonMessage, createJsonBody } from '@air-quality-sst/core/jsonUtil';
import { jwtErrorHandlingMiddleware, useMiddewares } from '@air-quality-sst/core/middlewareUtil';
import { stringToTimestampMilliseconds } from '@air-quality-sst/core/stringUtil';
import { useSession } from 'sst/node/auth';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import { type AttributeValue } from '@aws-sdk/client-dynamodb';

const dynamoDb = new DynamoDB.DocumentClient();

/**
 * Check if user is allowed to read data for this device
 */
const checkIfAuthorized = async (userId: string, deviceId: string): Promise<boolean> => {
  // Check if user is allowed to read data for this device
  const getParams = {
    TableName: Table.DeviceAdmins.tableName,
    Key: { deviceId },
  };
  const { Item: device } = await dynamoDb.get(getParams).promise();

  const authorizedUsers = device?.authorizedUsers?.values;
  const deviceAdmin = device?.adminId;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const isAuthorizedUser = !!authorizedUsers && Object.values(authorizedUsers).includes(userId);
  const isDeviceAdmin = userId === deviceAdmin;

  return isAuthorizedUser || isDeviceAdmin;
};

const convertTimestamps = (recordedTimestampStart: string | undefined, recordedTimestampEnd: string | undefined): Record<string, number | null> => {
  let recordedTimestampStartNumber = null; let recordedTimestampEndNumber = null;
  if (recordedTimestampStart) {
    recordedTimestampStartNumber = stringToTimestampMilliseconds(recordedTimestampStart);
  }
  if (recordedTimestampEnd) {
    recordedTimestampEndNumber = stringToTimestampMilliseconds(recordedTimestampEnd);
  }
  return { recordedTimestampStartNumber, recordedTimestampEndNumber };
};

const createQueryUsingTimestamps = (tableName: string, pkName: string, pkVal: string, skName: string, recordedTimestampStartNumber: number | null, recordedTimestampEndNumber: number | null): AWS.DynamoDB.DocumentClient.QueryInput => {
  // Get sensor data for this device
  let KeyConditionExpression: string = `${pkName} = :hkey`;
  if (recordedTimestampStartNumber && recordedTimestampEndNumber) {
    KeyConditionExpression += ` AND ${skName} BETWEEN :recordedTimestampStart AND :recordedTimestampEnd`;
  } else if (recordedTimestampStartNumber) {
    KeyConditionExpression += ` AND ${skName} >= :recordedTimestampStart`;
  } else if (recordedTimestampEndNumber) {
    KeyConditionExpression += ` AND ${skName} <= :recordedTimestampEnd`;
  }

  const ExpressionAttributeValues: Record<string, AttributeValue> = {
    // @ts-expect-error stupid dynamodb type stuff
    ':hkey': pkVal,
    ...(recordedTimestampStartNumber && { ':recordedTimestampStart': recordedTimestampStartNumber }),
    ...(recordedTimestampEndNumber && { ':recordedTimestampEnd': recordedTimestampEndNumber }),
  };

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property
  return {
    TableName: tableName,
    KeyConditionExpression,
    ExpressionAttributeValues,
  };
};

export const getTimestampHour = (time = Date.now()): number => Math.floor(time / (3600 * 1000)) * (3600 * 1000); // get just the hour
export const incrementTimestamp = (timestamp: number, hours: number): number => (timestamp + hours * (1000 * 60 * 60));

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
  try {
    const result = convertTimestamps(recordedTimestampStart, recordedTimestampEnd);
    recordedTimestampStartNumber = result.recordedTimestampStartNumber;
    recordedTimestampEndNumber = result.recordedTimestampEndNumber;
  } catch {
    return createJsonMessage(400, 'recordedTimestampStart must be a valid timestamp!');
  }

  // Check if user is allowed to read data for this device
  const userId = session.properties.userID;
  const isAuthorized = await checkIfAuthorized(userId, deviceId);

  if (!isAuthorized) {
    return createJsonMessage(403, 'Forbidden');
  }

  // Get sensor data for this device
  const params = createQueryUsingTimestamps(Table.SensorData.tableName, 'deviceId', deviceId, 'recordedTimestamp', recordedTimestampStartNumber, recordedTimestampEndNumber);
  const results = await dynamoDb.query(params).promise();

  return createJsonBody(200, results.Items);
});

const getAverageHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();
  const { deviceId } = usePathParams();
  const { recordedTimestampStart, recordedTimestampEnd } = useQueryParams();

  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  if (!deviceId) {
    return createJsonMessage(400, 'deviceId is required');
  }

  let recordedTimestampStartNumber = null; let recordedTimestampEndNumber = null;
  try {
    const result = convertTimestamps(recordedTimestampStart, recordedTimestampEnd);
    recordedTimestampStartNumber = result.recordedTimestampStartNumber;
    recordedTimestampEndNumber = result.recordedTimestampEndNumber;
  } catch {
    return createJsonMessage(400, 'recordedTimestamp must be a valid timestamp!');
  }

  if (recordedTimestampStartNumber === null) {
    return createJsonMessage(400, 'recordedTimestampStart');
  }
  if (recordedTimestampEndNumber === null) {
    recordedTimestampEndNumber = Date.now();
  }

  // Check if user is allowed to read data for this device
  const userId = session.properties.userID;
  const isAuthorized = await checkIfAuthorized(userId, deviceId);

  if (!isAuthorized) {
    return createJsonMessage(403, 'Forbidden');
  }

  const params = createQueryUsingTimestamps(Table.SensorDataAggregate.tableName, 'deviceId', deviceId, 'hourTimestamp', recordedTimestampStartNumber, recordedTimestampEndNumber);
  const results = await dynamoDb.query(params).promise();

  if (results.Items) {
    // Results are sorted since the SK is a number (https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html)
    // Entries will not exist for devices that did not write in that hour
    // We need to fill in these "missing" hours to make it easier to use the API

    const hourStartTimestamp = getTimestampHour(recordedTimestampStartNumber);
    const hourEndTimestamp = getTimestampHour(recordedTimestampEndNumber);

    // Keep track of where each timestamp should go in our array
    const timestampIndices: Record<number, number> = {};

    const resultArray = [];

    console.log('ITEMS', results.Items);

    // Generate all the timestamps
    for (let timestamp = hourStartTimestamp; timestamp <= hourEndTimestamp; timestamp += 3600000) {
      resultArray.push(null);
      console.log(timestamp, new Date(timestamp).getUTCHours());// TODO
      timestampIndices[timestamp] = resultArray.length - 1;
    }

    // Fill in array with our results from dynamo
    for (const item of results.Items) {
      const timestamp = item.hourTimestamp;
      const index = timestampIndices[timestamp];
      delete item.deviceId; // don't need the deviceId
      resultArray[index] = item;
    }

    return createJsonBody(200, resultArray);
  } else {
    return createJsonBody(200, null);
  }
});

export const createData = useMiddewares(createDataHandler, [httpErrorHandler, jsonBodyParser]);
export const getData = useMiddewares(getDataHandler, [httpErrorHandler, jwtErrorHandlingMiddleware]);
export const getDataAverages = useMiddewares(getAverageHandler, [httpErrorHandler, jwtErrorHandlingMiddleware]);
