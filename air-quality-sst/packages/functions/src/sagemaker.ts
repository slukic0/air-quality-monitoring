import { createJsonBody, createJsonMessage } from '@air-quality-sst/core/jsonUtil';
import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { SageMakerRuntime } from 'aws-sdk';
import { ApiHandler, usePathParams } from 'sst/node/api';
import { useSession } from 'sst/node/auth';

// grab environment variables
const ENDPOINT_NAME: string = process.env.ENDPOINT_NAME ?? '';
const runtime: SageMakerRuntime = new SageMakerRuntime();

export const handler: APIGatewayProxyHandlerV2 = ApiHandler(
  async (event: any) => {
    const session = useSession();
    if (session.type !== 'user') {
      return createJsonMessage(401, 'Unauthorized');
    }

    const { deviceId } = usePathParams();
    console.log('Received event: ', JSON.stringify(event, null, 2));

    const { data } = event;
    console.log(data);

    // TODO implement sagemaker endpoint
    return createJsonBody(200, { message: deviceId });

    const params: SageMakerRuntime.Types.InvokeEndpointInput = {
      EndpointName: ENDPOINT_NAME,
      ContentType: 'text/csv',
      Body: data,
    };

    try {
      const response: SageMakerRuntime.Types.InvokeEndpointOutput =
                await runtime.invokeEndpoint(params).promise();
      console.log(response);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const result = JSON.parse(response.Body.toString());
      console.log(result);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
);
