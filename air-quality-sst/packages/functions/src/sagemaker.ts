import { createJsonBody, createJsonMessage } from '@air-quality-sst/core/jsonUtil';
import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDB, SageMakerRuntime } from 'aws-sdk';
import { ApiHandler, usePathParams } from 'sst/node/api';
import { useSession } from 'sst/node/auth';
import executePaginatedQuery from '@air-quality-sst/core/src/dynamo/executePaginatedQuery';
import { Table } from 'sst/node/table';

// grab environment variables
const ENDPOINT_NAME: string = 'ml-aq-endpoint';
const runtime: SageMakerRuntime = new SageMakerRuntime();

const dynamoDb = new DynamoDB.DocumentClient();

const arrayToCSV = (arrays: any[]): string => {
  // Join each inner array with commas
  const csvRows = arrays.map(row => row.join(','));

  // Join rows with newline characters
  const csvString = csvRows.join('\n');

  return csvString;
};

const parseDynamoData = (data: any[]): any[] => {
  const headers = ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8'];
  const csvArray: any[] = [headers];

  data.forEach((item) => {
    const sensorData = item.payload.data;
    const row: any[] = [];
    sensorData.forEach((sensorReading: { tgasResistance: any }) => {
      row.push(sensorReading.tgasResistance);
    });
    csvArray.push(row);
  });

  return csvArray;
};

export const handler: APIGatewayProxyHandlerV2 = ApiHandler(
  async (event: any) => {
    const now = new Date();
    const prev = new Date(now.getTime() - 1000 * 60 * 15);

    // const session = useSession();
    // if (session.type !== 'user') {
    //   return createJsonMessage(401, 'Unauthorized');
    // }

    const { deviceId } = usePathParams();
    console.log('Received event: ', JSON.stringify(event, null, 2));

    // Get sensor data for this device
    const dynamoParams = {
      TableName: Table.SensorData.tableName,
      KeyConditionExpression: 'deviceId = :hkey AND recordedTimestamp BETWEEN :recordedTimestampStart AND :recordedTimestampEnd',
      ExpressionAttributeValues: {
        ':hkey': deviceId,
        ':recordedTimestampStart': prev.getTime(),
        ':recordedTimestampEnd': now.getTime(),
      },
    };
    const dynamoData = await executePaginatedQuery(dynamoDb, dynamoParams);
    console.log('dynamoData');
    console.log(dynamoData);

    const dynamoDataArray = parseDynamoData(dynamoData);
    console.log('dynamoDataArray');
    console.log(dynamoDataArray);

    const dynamoCsv = arrayToCSV(dynamoDataArray);
    console.log('dynamoCsv');
    console.log(dynamoCsv);

    const params: SageMakerRuntime.Types.InvokeEndpointInput = {
      EndpointName: ENDPOINT_NAME,
      ContentType: 'text/csv',
      Body: dynamoCsv,
    };

    console.log('Invoking endpoint', ENDPOINT_NAME);

    try {
      const response: SageMakerRuntime.Types.InvokeEndpointOutput =
                await runtime.invokeEndpoint(params).promise();

      console.log(response);

      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const result = JSON.parse(response.Body.toString());
      console.log(result);
      return createJsonBody(200, result);
    } catch (err) {
      console.error(err);
      return createJsonBody(500, err);
    }
  },
);
