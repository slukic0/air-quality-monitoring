import { Api, use, StackContext, Auth, StaticSite } from "sst/constructs";
import { StorageStack } from "./StorageStack";


export function AppStack({ stack, app }: StackContext) {
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
      "GET /api/sensorData": "packages/functions/src/sensorData.getData",
      "POST /api/sensorData": "packages/functions/src/sensorData.createData",
    },
  });

  const site = new StaticSite(stack, "ReactSite", {
    path: "packages/web",
    buildOutput: "dist",
    buildCommand: "npm run build",
    environment: {
      VITE_APP_API_URL: api.url,
    },
  });


  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
      bind: [site],
    },
  });

  auth.attach(stack, {
    api,
    prefix: "/auth",
  });
  
  

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
    WebAppUrl: site.url || "http://localhost:5173"
  });

  return {
    api,
    site,
  };
}