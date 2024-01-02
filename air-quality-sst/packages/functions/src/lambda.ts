import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: `Hello from SST. The time is ${new Date().toISOString()}. _evt: ${JSON.stringify(_evt)}`,
  };
});
