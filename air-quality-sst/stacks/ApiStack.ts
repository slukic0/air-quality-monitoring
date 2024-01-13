import { Api, use, StackContext } from "sst/constructs";
import { StorageStack } from "./StorageStack";


export function ApiStack({ stack, app }: StackContext) {
  const { sensorDataTable, usersTable, deviceAdminsTable } = use(StorageStack);

  // Create the API
  const api = new Api(stack, "App", {
    defaults: {
      function: {
        bind: [sensorDataTable, usersTable, deviceAdminsTable],
      },
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "GET /session": "packages/functions/src/session.handler",
      // get sensorData for a given device
      "GET /api/sensorData/{deviceId}": "packages/functions/src/sensorData.getData",
      // create sensor data for a given device
      "POST /api/sensorData": "packages/functions/src/sensorData.createData",
      // register a device to an owner
      "POST /api/devices/registerDevice": "packages/functions/src/devices.registerDevice",
      // add an authorized user to a device
      // "POST /api/devices/addUser": "packages/functions/src/devices.addUser",
      // remove an authorized user from a device
      // "POST /api/devices/removeUser": "packages/functions/src/devices.removeUser",
    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  return {
    api,
  };
}