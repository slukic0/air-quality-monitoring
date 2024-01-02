import { SSTConfig } from "sst";
import { StorageStack } from "./stacks/StorageStack";
import { AppStack } from "./stacks/AppStack";

export default {
  config(_input) {
    return {
      name: "air-quality-sst",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(StorageStack);
    app.stack(AppStack);
  },
} satisfies SSTConfig;
