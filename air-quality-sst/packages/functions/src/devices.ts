import { DynamoDB } from 'aws-sdk';
import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ApiHandler, usePathParams, useQueryParams } from 'sst/node/api';
import { Table } from 'sst/node/table';
import { createJsonBody, createJsonMessage } from '@air-quality-sst/core/jsonUtil';
import jsonBodyParser from '@middy/http-json-body-parser';
import { useSession } from 'sst/node/auth';
import { jwtErrorHandlingMiddleware, useMiddewares } from '@air-quality-sst/core/middlewareUtil';
import httpErrorHandler from '@middy/http-error-handler';

const dynamoDb = new DynamoDB.DocumentClient();

/**
 * Takes a deviceId and registers it to a user
 *
 * @param deviceId the deviceID to register
 *
 * @returns
 *  409 if already registered
 *  201 for success
 */
const registerDeviceHandler: APIGatewayProxyHandlerV2 = ApiHandler(
  async (event: any) => {
    const session = useSession();

    // Check user is authenticated
    if (session.type !== 'user') {
      return createJsonMessage(401, 'Unauthorized');
    }

    const data = event.body;
    if (!data?.deviceId) {
      createJsonMessage(400, 'deviceId is required');
    }

    // Register device to user if the device is not registered
    const PutDeviceAdmin = {
      TableName: Table.DeviceAdmins.tableName,
      Item: {
        deviceId: data.deviceId,
        adminId: session.properties.userID,
      },
      ConditionExpression: 'attribute_not_exists(deviceId)',
    };

    // Add device to list of user's admin devices
    const UpdateUsers = {
      TableName: Table.Users.tableName,
      Key: { userId: session.properties.userID },
      UpdateExpression: 'ADD adminDevices :adminDevices',
      ExpressionAttributeValues: {
        ':adminDevices': dynamoDb.createSet([data.deviceId]),
      },
    };

    // Create transaction
    const params = {
      TransactItems: [{ Put: PutDeviceAdmin }, { Update: UpdateUsers }],
    };

    // Return result
    try {
      await dynamoDb.transactWrite(params).promise();
      return createJsonMessage(201, `${data.deviceId} registered`);
    } catch (err: any) {
      if (err.CancellationReasons[0].Code === 'ConditionalCheckFailed') {
        return createJsonMessage(409, 'Device already registered');
      } else {
        console.log(err);
        console.log(err.CancellationReasons);
        return createJsonMessage(500, 'Internal Server Error');
      }
    }
  },
);

/**
 * Add an authorized user to a registered device
 *
 * @param deviceId the deviceId
 * @param userId the userId of the user to be added
 *
 * @returns
 *  403 if the calling user is not the device admin
 *  200 for success
 */
const addUserHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  const data = event.body;
  if (!data?.deviceId) {
    createJsonMessage(400, 'deviceId is required');
  } else if (!data?.userId) {
    createJsonMessage(400, 'userId is required');
  }

  // Add authorized user to DeviceAdmins if the user is the device admin
  const UpdateDeviceAdmins = {
    TableName: Table.DeviceAdmins.tableName,
    Key: { deviceId: data.deviceId },
    ConditionExpression:
            'attribute_exists(deviceId) AND adminId = :adminId',
    UpdateExpression: 'ADD authorizedUsers :authorizedUsers',
    ExpressionAttributeValues: {
      ':authorizedUsers': dynamoDb.createSet([data.userId]),
      ':adminId': session.properties.userID,
    },
  };

  // Update the authorized user's authorizedDevices set
  const UpdateUsers = {
    TableName: Table.Users.tableName,
    Key: { userId: data.userId },
    UpdateExpression: 'ADD authorizedDevices :authorizedDevices',
    ExpressionAttributeValues: {
      ':authorizedDevices': dynamoDb.createSet([data.deviceId]),
    },
  };

  // Create transaction
  const params = {
    TransactItems: [
      { Update: UpdateDeviceAdmins },
      { Update: UpdateUsers },
    ],
  };

  // Return result
  try {
    await dynamoDb.transactWrite(params).promise();
    return createJsonBody(200, `${data.userId} added as authorized user`);
  } catch (err: any) {
    if (err.CancellationReasons[0].Code === 'ConditionalCheckFailed') {
      // The device is not registered OR the user is not the device admin
      return createJsonMessage(403, 'Forbidden');
    } else {
      console.log(err);
      console.log(err.CancellationReasons);
      return createJsonMessage(500, 'Internal Server Error');
    }
  }
});

/**
 * Remove an authorized user from a registered device
 *
 * @param deviceId the deviceId
 * @param userId the userId of the user to be removed
 *
 * @returns
 *  403 if the calling user is not the device admin
 *  200 for success
 */
const removeUserHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  const data = event.body;
  if (!data?.deviceId) {
    createJsonMessage(400, 'deviceId is required');
  } else if (!data?.userId) {
    createJsonMessage(400, 'userId is required');
  }

  // Remove authorized user from the DeviceAdmins able
  const UpdateDeviceAdmins = {
    TableName: Table.DeviceAdmins.tableName,
    Key: { deviceId: data.deviceId },
    ConditionExpression:
            'attribute_exists(deviceId) AND adminId = :adminId',
    UpdateExpression: 'DELETE authorizedUsers :authorizedUsers',
    ExpressionAttributeValues: {
      ':authorizedUsers': dynamoDb.createSet([data.userId]),
      ':adminId': session.properties.userID,
    },
  };

  // Update the authorized user's authorizedDevices set
  const UpdateUsers = {
    TableName: Table.Users.tableName,
    Key: { userId: data.userId },
    UpdateExpression: 'DELETE authorizedDevices :authorizedDevices',
    ExpressionAttributeValues: {
      ':authorizedDevices': dynamoDb.createSet([data.deviceId]),
    },
  };

  // Create transaction
  const params = {
    TransactItems: [
      { Update: UpdateDeviceAdmins },
      { Update: UpdateUsers },
    ],
  };

  // Return result
  try {
    await dynamoDb.transactWrite(params).promise();
    return createJsonBody(200, `${data.userId} removed as authorized user`);
  } catch (err: any) {
    if (err.CancellationReasons[0].Code === 'ConditionalCheckFailed') {
      // The device is not registered OR the user is not the device admin
      return createJsonMessage(403, 'Forbidden');
    } else {
      console.log(err);
      console.log(err.CancellationReasons);
      return createJsonMessage(500, 'Internal Server Error');
    }
  }
});

const unregisterDeviceHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  const data = event.body;
  if (!data?.deviceId) {
    createJsonMessage(400, 'deviceId is required');
  }

  // Get the list of authorized users for this device.
  const QueryDeviceAdmins = {
    TableName: Table.DeviceAdmins.tableName,
    KeyConditionExpression: 'deviceId = :hkey',
    ExpressionAttributeValues: {
      ':hkey': data.deviceId,
    },
  };
  const { Items } = await dynamoDb.query(QueryDeviceAdmins).promise();

  if (!Items || Items.length === 0) {
    return createJsonMessage(404, 'Device not found');
  }

  const device = Items[0];
  const deviceAdminId = device.adminId;
  const deviceAuthorizedUsers = device?.authorizedUsers?.values;

  if (session.properties.userID !== deviceAdminId) {
    return createJsonMessage(403, 'Forbidden');
  }

  // Unregister device
  const DeleteDeviceAdminsOperation = {
    Delete: {
      TableName: Table.DeviceAdmins.tableName,
      Key: { deviceId: data.deviceId },
    },
  };

  // Remove device from all affected users
  // Note: if there is only the device admin and no users, deviceAuthorizedUsers will be null
  // eslint-disable-next-line @typescript-eslint/ban-types
  const UsersTableUpdateOperations: Object[] = [];
  if (deviceAuthorizedUsers) {
    for (const user of deviceAuthorizedUsers) {
      UsersTableUpdateOperations.push({
        Update: {
          TableName: Table.Users.tableName,
          Key: { userId: user },
          UpdateExpression: 'DELETE authorizedDevices :authorizedDevices',
          ExpressionAttributeValues: {
            ':authorizedDevices': dynamoDb.createSet([data.deviceId]),
          },
        },
      });
    }
  }
  // Remove device from admin's user profile
  UsersTableUpdateOperations.push({
    Update: {
      TableName: Table.Users.tableName,
      Key: { userId: session.properties.userID },
      UpdateExpression: 'DELETE adminDevices :adminDevices',
      ExpressionAttributeValues: {
        ':adminDevices': dynamoDb.createSet([data.deviceId]),
      },
    },
  });

  const transaction = {
    TransactItems: [
      DeleteDeviceAdminsOperation,
      ...UsersTableUpdateOperations,
    ],
  };

  try {
    await dynamoDb.transactWrite(transaction).promise();
    return createJsonMessage(204, 'Deleted');
  } catch (err: any) {
    console.log(err);
    console.log(err.CancellationReasons);
    return createJsonMessage(500, 'Internal Server Error');
  }
});

const getDeviceHandler: APIGatewayProxyHandlerV2 = ApiHandler(async (event: any) => {
  const session = useSession();
  const { deviceId } = usePathParams();
  const { hydrate } = useQueryParams();

  // Check user is authenticated
  if (session.type !== 'user') {
    return createJsonMessage(401, 'Unauthorized');
  }

  if (typeof deviceId !== 'string') {
    return createJsonMessage(400, 'deviceId is required');
  }

  const getItemParams = {
    TableName: Table.DeviceAdmins.tableName,
    Key: { deviceId },
  };

  const { Item: device } = await dynamoDb.get(getItemParams).promise();
  // convert string sets to arrays
  if (device?.authorizedUsers) {
    device.authorizedUsers = device.authorizedUsers.values;
  }

  if (!device) {
    return createJsonBody(404, null);
  } else {
    if (hydrate) {
      // get the users names and emails, not just the Ids
      const { adminId, authorizedUsers } = device as { adminId: string, authorizedUsers: string[] };

      const deviceUserIds = authorizedUsers ? [...authorizedUsers, adminId] : [adminId];
      const deviceUserIdKeys = deviceUserIds.map((userId: string) => ({ userId }));

      const batchGetParams = {
        RequestItems: {
          [Table.Users.tableName]: {
            Keys: deviceUserIdKeys,
            ProjectionExpression: 'userId, email, #givenName',
            ExpressionAttributeNames: {
              '#givenName': 'name',
            },
          },
        },
      };

      const result = await dynamoDb.batchGet(batchGetParams).promise();
      if (!result.Responses || (!!result.UnprocessedKeys && Object.keys(result.UnprocessedKeys).length > 0)) {
        return createJsonMessage(500, 'Cannot hydrate');
      }

      // hydrate the device information
      const users = result.Responses[Table.Users.tableName];
      const userMap = Object.fromEntries(
        users.map(user => [user.userId, user]),
      );

      device.adminId = userMap[adminId];
      if (device.authorizedUsers && device.authorizedUsers.length > 0) {
        device.authorizedUsers = device.authorizedUsers.map((userId: string) => userMap[userId]);
      }
    }
    return createJsonBody(200, device);
  }
});

const middleware = [httpErrorHandler, jwtErrorHandlingMiddleware, jsonBodyParser];

export const registerDevice = useMiddewares(registerDeviceHandler, middleware);
export const addUser = useMiddewares(addUserHandler, middleware);
export const removeUser = useMiddewares(removeUserHandler, middleware);
export const unregisterDevice = useMiddewares(unregisterDeviceHandler, middleware);
export const getDevice = useMiddewares(getDeviceHandler, [httpErrorHandler, jwtErrorHandlingMiddleware]);
