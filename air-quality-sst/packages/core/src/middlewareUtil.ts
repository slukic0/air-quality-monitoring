import httpErrorHandler from '@middy/http-error-handler'
import middy from '@middy/core'
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'

export const jwtErrorHandlingMiddleware = (opts = {}) => {
    httpErrorHandler()
    const onError = async (request: any) => {
        if (request.error?.code?.includes('JWT')) {
            request.response = {
                statusCode: 401,
                body: 'Invalid Token',
            }
        }
    }

    return {
        onError,
    }
}

export const useMiddewares = (
    handler: APIGatewayProxyHandlerV2,
    middlewares: any[]
) => {
    const mid = middy()
    for (const middleware of middlewares) {
        mid.use(middleware())
    }
    mid.handler(handler)
    return mid
}
