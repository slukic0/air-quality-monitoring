import AWS from "aws-sdk";
import { Table } from "sst/node/table";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ApiHandler, usePathParams, useQueryParams } from "sst/node/api";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * Put a sensorData item into the database
 */
export const createData: APIGatewayProxyHandlerV2 = async (event) => {
  const data = JSON.parse(event?.body || "");

  if (!data || typeof(data.deviceId) !== "string" || typeof(data.recordedTimestamp) !== "number" || typeof(data.sensorNumber) !== "number"){
    return {
      statusCode: 400,
      body: JSON.stringify({message: 'Invalid Parameter'}),
    }
  }

  if (!data.lablel){
    data.label = "";
  }

  const params = {
    TableName: Table.SensorData.tableName,
    Item: data,
  };

  await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
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
    return{
      statusCode: 400,
      body: JSON.stringify({message: 'deviceId is required'}),
    }
  }

  const recordedTimestampNumber = Number(recordedTimestamp);
  if (isNaN(recordedTimestampNumber)){
    return {
      statusCode: 400,
      body: JSON.stringify({message: 'recordedTimestamp must be a number'}),
    } 
  }

  const KeyConditionExpression = !!recordedTimestamp ? 'deviceId = :hkey and recordedTimestamp >= :skey' : 'deviceId = :hkey'
  const ExpressionAttributeValues = {
    ':hkey': deviceId,
    ':skey': recordedTimestampNumber
  }

  console.log(KeyConditionExpression);
  console.log(ExpressionAttributeValues);
  

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property
  const params = {
    TableName: Table.SensorData.tableName,
    KeyConditionExpression,
    ExpressionAttributeValues,
  };

  const results = await dynamoDb.query(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(results.Items),
  };
});