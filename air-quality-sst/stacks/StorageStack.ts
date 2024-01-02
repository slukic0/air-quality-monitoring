import { StackContext, Table } from "sst/constructs";

export function StorageStack({ stack, app }: StackContext) {
  const sensorDataTable = new Table(stack, "SensorData", {
    fields: {
        deviceId: "string",
        timeStamp: "number",
        lablel: "string",
        sensorNumber: "number",
    },
    primaryIndex: { partitionKey: "deviceId", sortKey: "timeStamp" },
  });
  const usersTable = new Table(stack, "Users", {
    fields: {
        userId: "string",
    },
    primaryIndex: { partitionKey: "userId" },
  });

  return {
    sensorDataTable,
    usersTable,
  };
}
