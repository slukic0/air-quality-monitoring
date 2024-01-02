import { StackContext, Table } from "sst/constructs";

export function StorageStack({ stack, app }: StackContext) {
  const table = new Table(stack, "SensorData", {
    fields: {
        deviceId: "string",
        timeStamp: "number",
        lablel: "string",
        sensorNumber: "number",
    },
    primaryIndex: { partitionKey: "deviceId", sortKey: "timeStamp" },
  });

  return {
    table,
  };
}
