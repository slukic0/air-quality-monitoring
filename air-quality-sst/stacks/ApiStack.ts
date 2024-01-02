import { Api, use, StackContext, Auth } from "sst/constructs";
import { StorageStack } from "./StorageStack";



export function ApiStack({ stack, app }: StackContext) {
  const { table } = use(StorageStack);

  // Create the API
  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        bind: [table],
      },
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "GET /api/sensorData": "packages/functions/src/sensorData.getData",
      "POST /api/sensorData": "packages/functions/src/sensorData.createData",
    },
  });

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    },
  });

  auth.attach(stack, {
    api,
    prefix: "/auth",
  });
  
  

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  // Return the API resource
  return {
    api,
  };
}