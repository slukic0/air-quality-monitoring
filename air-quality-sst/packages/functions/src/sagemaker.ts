import { type APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { SageMakerRuntime } from 'aws-sdk';
import { ApiHandler } from 'sst/node/api';

// grab environment variables
const ENDPOINT_NAME: string = process.env.ENDPOINT_NAME ?? '';
const runtime: SageMakerRuntime = new SageMakerRuntime();

export const handler: APIGatewayProxyHandlerV2 = ApiHandler(
  async (event: any) => {
    console.log('Received event: ', JSON.stringify(event, null, 2));

    const { data } = event;
    console.log(data);

    const params: SageMakerRuntime.Types.InvokeEndpointInput = {
      EndpointName: ENDPOINT_NAME,
      ContentType: 'text/csv',
      Body: data,
    };

    try {
      const response: SageMakerRuntime.Types.InvokeEndpointOutput = await runtime.invokeEndpoint(params).promise();
      console.log(response);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const result = JSON.parse(response.Body.toString());
      console.log(result);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  });
