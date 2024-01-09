import { use, StackContext, StaticSite } from "sst/constructs";
import { ApiStack } from "./ApiStack";


export function WebStack({ stack, app }: StackContext) {
  const { api } = use(ApiStack);

  const site = new StaticSite(stack, "ReactSite", {
    path: "packages/web",
    buildOutput: "dist",
    buildCommand: "npm run build",
    environment: {
      VITE_APP_API_URL: api.url,
    },
  });

  stack.addOutputs({
    WebAppUrl: site.url || "http://localhost:5173"
  });

  return {
    site,
  };
}