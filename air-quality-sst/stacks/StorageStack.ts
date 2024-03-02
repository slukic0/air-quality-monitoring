import { StackContext, Table } from "sst/constructs";

export function StorageStack({ stack, app }: StackContext) {

  // Table to store sensor data
  const sensorDataTable = new Table(stack, "SensorData", {
    fields: {
        deviceId: "string",
        recordedTimestamp: "number",
    },
    primaryIndex: { partitionKey: "deviceId", sortKey: "recordedTimestamp" },
  });

  // Table to store users
  const usersTable = new Table(stack, "Users", {
    fields: {
        userId: "string",
        email: "string",
        emailFirstLetter: "string"
    },
    primaryIndex: { partitionKey: "userId" },
    globalIndexes:{
      emailLetterIndex: { 
        partitionKey: "emailFirstLetter",
        projection: 'all'
      }
    }
  });

  // Table to store device owners
  const deviceAdminsTable = new Table(stack, "DeviceAdmins", {
    fields: {
      deviceId: "string",
      adminId: "string",
    },
    primaryIndex: { partitionKey: "deviceId" },
  })

  const sensorDataAggregateTable = new Table(stack, "SensorDataAggregate", {
    fields: {
      deviceId: "string",
      hourTimestamp: "number"
    },
    primaryIndex: { partitionKey: "deviceId", sortKey: "hourTimestamp" },
  })


  return {
    sensorDataTable,
    usersTable,
    deviceAdminsTable,
    sensorDataAggregateTable,
  };
}
