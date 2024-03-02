import { StackContext, Cron, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";


export function CronStack({ stack, app }: StackContext) {
    const { deviceAdminsTable, sensorDataTable, sensorDataAggregateTable } = use(StorageStack);

    const deviceDataAggregator = new Cron(stack, "Cron", {
        schedule: "cron(0 * * * ? *)", // every hour
        job: "packages/functions/src/deviceDataAggregator.main",
    });

    deviceDataAggregator.attachPermissions(["dynamodb"]);
    deviceDataAggregator.bind([deviceAdminsTable, sensorDataTable, sensorDataAggregateTable])
}