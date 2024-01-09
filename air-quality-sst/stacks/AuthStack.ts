import { use, StackContext, Auth } from "sst/constructs";
import { ApiStack } from "./ApiStack";
import { WebStack } from "./WebStack";


export function AuthStack({ stack, app }: StackContext) {
  const { api } = use(ApiStack);
  const { site } = use(WebStack)

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
      bind: [site],
    },
  });

  auth.attach(stack, {
    api,
    prefix: "/auth",
  });


  return {
    auth
  };
}