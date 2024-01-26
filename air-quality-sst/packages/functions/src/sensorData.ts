import AWS from 'aws-sdk';
import { Table } from 'sst/node/table';
import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ApiHandler, usePathParams, useQueryParams } from 'sst/node/api';
import { createJsonMessage, createJsonBody } from '@air-quality-sst/core/jsonUtil';
import { useSession } from 'sst/node/auth';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * Put a sensorData item into the database
 */
export const createData: APIGatewayProxyHandlerV2 = async (event) => {
  const data = JSON.parse(event?.body ?? '');

  if (!data || typeof (data.deviceId) !== 'string' || typeof (data.recordedTimestamp) !== 'number') {
    return createJsonMessage(400, 'Invalid Parameter');
  }

  const params = {
    TableName: Table.SensorData.tableName,
    Item: data,
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
export const getData: APIGatewayProxyHandlerV2 = ApiHandler(async (event) => {
  const session = useSession();
  const { deviceId } = usePathParams();
  const { recordedTimestamp } = useQueryParams();

  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  if (!deviceId) {
    return createJsonMessage(400, 'deviceId is required');
  }

  // Convert recordedTimestampNumber to a number
  let recordedTimestampNumber = null;
  if (recordedTimestamp) {
    let recordedTimestampMilliseconds;
    if (recordedTimestamp.length === 10) {
      recordedTimestampMilliseconds = recordedTimestamp + '000';
    } else if (recordedTimestamp.length === 13) {
      recordedTimestampMilliseconds = recordedTimestamp;
    } else {
      return createJsonMessage(400, 'Invalid timestamp');
    }

    recordedTimestampNumber = Number(recordedTimestampMilliseconds);
    if (isNaN(recordedTimestampNumber)) {
      return createJsonMessage(400, 'recordedTimestamp must be a number');
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
  const KeyConditionExpression = recordedTimestamp ? 'deviceId = :hkey and recordedTimestamp >= :skey' : 'deviceId = :hkey';
  const ExpressionAttributeValues = {
    ':hkey': deviceId,
    ...(recordedTimestampNumber && { ':skey': recordedTimestampNumber }),
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
