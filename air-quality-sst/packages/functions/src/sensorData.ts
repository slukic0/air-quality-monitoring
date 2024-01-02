// packages/functions/src/create.ts
import * as uuid from "uuid";
import AWS from "aws-sdk";
import { Table } from "sst/node/table";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const createData: APIGatewayProxyHandlerV2 = async (event) => {
  const data = JSON.parse(event?.body || "");

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


export const getData: APIGatewayProxyHandlerV2 = async (event) => {
  const params = {
    TableName: Table.SensorData.tableName,
  };
  const results = await dynamoDb.scan(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(results.Items),
  };
}