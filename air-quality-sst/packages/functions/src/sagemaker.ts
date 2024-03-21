import { createJsonBody } from '@air-quality-sst/core/jsonUtil';
import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDB, SageMakerRuntime } from 'aws-sdk';
import { ApiHandler, usePathParams } from 'sst/node/api';
import executePaginatedQuery from '@air-quality-sst/core/src/dynamo/executePaginatedQuery';
import { Table } from 'sst/node/table';
import { useSession } from 'sst/node/auth';

const ENDPOINT_NAME: string = 'sklearn-local-ep2024-03-21-02-54-09';
const runtime: SageMakerRuntime = new SageMakerRuntime();

const dynamoDb = new DynamoDB.DocumentClient();

const parseDynamoData = (data: any[]): any[] => {
  const arr: any[] = [];

  data.forEach((item) => {
    const sensorData = item.payload.data;
    const row: any[] = [];
    sensorData.forEach((sensorReading: { tgasResistance: any }) => {
      row.push(sensorReading.tgasResistance);
    });
    arr.push(row);
  });

  return arr;
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

    if (dynamoData.length === 0) {
      return createJsonBody(200, 'No Data');
    }

    console.log('dynamoData');
    console.log(dynamoData);

    const dynamoDataArray = parseDynamoData(dynamoData);
    console.log('dynamoDataArray');
    console.log(dynamoDataArray);

    const body = {
      Input: dynamoDataArray,
    };
    // const body = { // this returns 1
    //   Input: [[-1.30087652, -1.64633815, -1.60981466, -1.72198166, -1.42560473, -1.55332533, -1.10534774, -1.27594878]],
    // };

    const params: SageMakerRuntime.Types.InvokeEndpointInput = {
      EndpointName: ENDPOINT_NAME,
      ContentType: 'application/json',
      Body: JSON.stringify(body),
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
