import AWS from "aws-sdk";
import { Table } from "sst/node/table";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ApiHandler, usePathParams, useQueryParams } from "sst/node/api";
import { createJsonMessage, createJsonBody } from "@air-quality-sst/core/util";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * Put a sensorData item into the database
 */
export const createData: APIGatewayProxyHandlerV2 = async (event) => {
  const data = JSON.parse(event?.body || "");

  if (!data || typeof(data.deviceId) !== "string" || typeof(data.recordedTimestamp) !== "number"){
    return createJsonMessage(400, 'Invalid Parameter');
  }

  const params = {
    TableName: Table.SensorData.tableName,
    Item: data,
  };

  await dynamoDb.put(params).promise();

  return createJsonBody(201, params.Item)
};


/**
 * Get sensor data from a given device.
 * Only returns records newer than the recordedTimestamp if it is provided.
 * The deviceId is a path param and the recordedTimestamp is a query param.
 */
export const getData: APIGatewayProxyHandlerV2 = ApiHandler(async (event) => {
  const { deviceId } = usePathParams();
  const { recordedTimestamp } = useQueryParams();


  if (!deviceId){
    return createJsonMessage(400, 'deviceId is required');
  }

  let recordedTimestampNumber = null;
  if (recordedTimestamp){
     recordedTimestampNumber = Number(recordedTimestamp);
    if (isNaN(recordedTimestampNumber)){
      return createJsonMessage(400, 'recordedTimestamp must be a number');
    }
  }
  

  const KeyConditionExpression = !!recordedTimestamp ? 'deviceId = :hkey and recordedTimestamp >= :skey' : 'deviceId = :hkey'
  const ExpressionAttributeValues = {
    ':hkey': deviceId,
    ...(recordedTimestampNumber && {':skey': recordedTimestampNumber})
  }


  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property
  const params = {
    TableName: Table.SensorData.tableName,
    KeyConditionExpression,
    ExpressionAttributeValues,
  };

  const results = await dynamoDb.query(params).promise();

  return createJsonBody(200, results.Items);
});