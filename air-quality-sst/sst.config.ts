import { SSTConfig } from "sst";
import { StorageStack } from "./stacks/StorageStack";
import { ApiStack } from "./stacks/ApiStack";
import { WebStack } from "./stacks/WebStack";
import { AuthStack } from "./stacks/AuthStack";
import { CronStack } from "./stacks/CronStack";

export default {
  config(_input) {
    return {
      name: "air-quality-sst",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(StorageStack);
    app.stack(ApiStack);
    app.stack(WebStack);
    app.stack(AuthStack);
    app.stack(CronStack);
    // Remove all resources when non-prod stages are removed
    if (app.stage !== "prod") {
      app.setDefaultRemovalPolicy("destroy");
    }
  },
} satisfies SSTConfig;
