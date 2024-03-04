import { createJsonBody } from '@air-quality-sst/core/jsonUtil';
import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { Table } from 'sst/node/table';

const dynamoDb = new DynamoDB.DocumentClient();

export const main: APIGatewayProxyHandlerV2 = async (event: any) => {
  const now = Date.now();
  const oneHourAgo = now - (3600 * 1000); // 3600 s * 1000 ms
  const nowTruncatedToHour = Math.floor(now / (3600 * 1000)) * (3600 * 1000); // get just the hour

  // get all deviceIds
  const scanParams = {
    TableName: Table.DeviceAdmins.tableName,
    ProjectionExpression: 'deviceId',
  };

  const { Items } = await dynamoDb.scan(scanParams).promise();
  if (!Items) {
    return createJsonBody(200, Items);
  }

  const deviceIds = [];
  for (const { deviceId } of Items) {
    deviceIds.push(deviceId);
  }

  // get data for each device from the last hour
  const queryPromises = [];
  for (const deviceId of deviceIds) {
    // query sensorData from the last hour for each device
    const queryParams = {
      TableName: Table.SensorData.tableName,
      KeyConditionExpression: 'deviceId = :hkey AND recordedTimestamp BETWEEN :recordedTimestampStart AND :recordedTimestampEnd',
      ExpressionAttributeValues: {
        ':hkey': deviceId,
        ':recordedTimestampStart': oneHourAgo,
        ':recordedTimestampEnd': now,
      },
    };
    queryPromises.push(dynamoDb.query(queryParams).promise());
  }

  // Resolve promises
  const resolvedQueryPromises = await Promise.all(queryPromises);

  // Get the data from each device and calculate the averages
  const dataLastHour: Record<string, any> = {};
  resolvedQueryPromises.forEach((result) => {
    const count = result.Count ?? 0;
    if (count > 0 && result.Items) {
      // get all data from each device
      const items = result.Items;
      const deviceId = items[0].deviceId;
      const numSensors = items[0].payload.data.length;
      const deviceData = [];

      for (const item of items) {
        const data = item.payload.data;
        for (const sensorReading of data) {
          deviceData.push(sensorReading);
        }
      }

      // sum all the sensor values
      const deviceDataAverage = deviceData.reduce((accumulator: Record<string, number>, currentValue) => {
        for (const key of Object.keys(accumulator)) {
          accumulator[key] += currentValue[key];
        }
        return accumulator;
      }, {
        tgasResistance: 0,
        tiaq: 0,
        tpressure: 0,
        ttemperature: 0,
        thumidity: 0,
      });

      // divide the sums
      for (const [key, value] of Object.entries(deviceDataAverage)) {
        deviceDataAverage[key] = value / (count * numSensors);
      }
      dataLastHour[deviceId] = deviceDataAverage;
    }
  });

  console.log(dataLastHour);

  if (Object.keys(dataLastHour).length > 0) {
    // write the aggregated results
    const putRequests = [];

    for (const [key, value] of Object.entries(dataLastHour)) {
      const putParams = {
        TableName: Table.SensorDataAggregate.tableName,
        Item: {
          deviceId: key,
          hourTimestamp: nowTruncatedToHour,
          ...value,
        },
      };

      putRequests.push({ PutRequest: putParams });
    }

    const batchWriteParams = {
      RequestItems: {
        [Table.SensorDataAggregate.tableName]: putRequests,
      },
    };

    const res = await dynamoDb.batchWrite(batchWriteParams).promise();
    return createJsonBody(200, { dataLastHour, res });
  } else {
    return createJsonBody(200, dataLastHour);
  }
};
