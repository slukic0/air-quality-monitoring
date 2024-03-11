import { Api, use, StackContext } from "sst/constructs";
import { StorageStack } from "./StorageStack";
import * as iam from "aws-cdk-lib/aws-iam";


export function ApiStack({ stack, app }: StackContext) {
  const { sensorDataTable, usersTable, deviceAdminsTable, sensorDataAggregateTable } = use(StorageStack);

  // Create the API
  const api = new Api(stack, "App", {
    defaults: {
      function: {
        bind: [sensorDataTable, usersTable, deviceAdminsTable, sensorDataAggregateTable],
      },
    },
    routes: {
      // test endpoint
      "GET /": "packages/functions/src/lambda.handler",

      // get session information (user info)
      "GET /session": "packages/functions/src/session.handler",

      // get sensorData for a given device
      "GET /api/sensorData/{deviceId}": "packages/functions/src/sensorData.getData",

      // get sensorData for a given device
      "GET /api/sensorData/{deviceId}/average": "packages/functions/src/sensorData.getDataAverages",

      // create sensor data for a given device (test endpoint)
      "POST /api/sensorData": "packages/functions/src/sensorData.createData",

      // register a device to a device admin
      "POST /api/devices/registerDevice": "packages/functions/src/devices.registerDevice",

      // add an authorized user to a device
      "POST /api/devices/addUser": "packages/functions/src/devices.addUser",

      // remove an authorized user from a device
      "POST /api/devices/removeUser": "packages/functions/src/devices.removeUser",

      // TODO Change device owner
      // "POST /api/devices/changeAdmin": "packages/functions/src/devices.changeAdmin",

      // get device by ID
      "GET /api/device/{deviceId}": "packages/functions/src/devices.getDevice",

      // unregister a device. NOTE: Will also remove all authorized users.
      "POST /api/devices/unregisterDevice": "packages/functions/src/devices.unregisterDevice",
      
      // list users by specifiying the start of their email address
      "GET /api/users/{emailString}": "packages/functions/src/users.getUsersByEmail",

      // get user by userId
      "GET /api/user/{userId}": "packages/functions/src/users.getUser",

      // call sagemaker endpoint
      "POST /api/ml": "packages/functions/src/sagemaker.handler",


      /* Cron job testing */
      // "PUT /api/data/aggregate": "packages/functions/src/deviceDataAggregator.main",
    },
  });

  api.attachPermissions([
    new iam.PolicyStatement({
      actions: ["sagemaker:InvokeEndpoint"],
      effect: iam.Effect.ALLOW,
      resources: [
        '*',
      ],
    }),
  ])

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  return {
    api,
  };
}