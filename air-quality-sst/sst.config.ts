import { SSTConfig } from "sst";
import { StorageStack } from "./stacks/StorageStack";
import { ApiStack } from "./stacks/ApiStack";
import { WebAppStack } from "./stacks/WebAppStack";

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
    app.stack(WebAppStack);
  },
} satisfies SSTConfig;
