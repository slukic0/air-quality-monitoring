import { Api, use, StackContext } from "sst/constructs";
import { StorageStack } from "./StorageStack";


export function ApiStack({ stack, app }: StackContext) {
  const { sensorDataTable, usersTable } = use(StorageStack);

  // Create the API
  const api = new Api(stack, "App", {
    defaults: {
      function: {
        bind: [sensorDataTable, usersTable],
      },
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "GET /session": "packages/functions/src/session.handler",
      "GET /api/sensorData/{deviceId}": "packages/functions/src/sensorData.getData",
      "POST /api/sensorData": "packages/functions/src/sensorData.createData",
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