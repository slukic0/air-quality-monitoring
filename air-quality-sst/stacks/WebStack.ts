import { use, StackContext, NextjsSite } from "sst/constructs";
import { ApiStack } from "./ApiStack";


export function WebStack({ stack, app }: StackContext) {
  const { api } = use(ApiStack);

  // Create the Next.js site
  const site = new NextjsSite(stack, "Site", {
    path: "packages/web",
    environment: {
      NEXT_PUBLIC_API_URL: api.url,
    },
    edge: false, //  we don't need cloudfront tbh
  });

  stack.addOutputs({
    WebAppUrl: site.url || "http://localhost:3000"
  });

  return {
    site,
  };
}