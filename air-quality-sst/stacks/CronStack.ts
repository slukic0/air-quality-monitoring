import { StackContext, Cron } from "sst/constructs";


export function CronStack({ stack, app }: StackContext) {

    const deviceDataAggregator = new Cron(stack, "Cron", {
        schedule: "cron(0 * * * *)", // every hour
        job: "packages/functions/src/deviceDataAggregator.main",
    });
    deviceDataAggregator.attachPermissions(["deviceDataAggregator"]);



}