import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

/**
 * Return a JSON message
 * @param statusCode HTTP status code
 * @param message Human readable message
 */
export const createJsonMessage: (
    statusCode: number,
    message: string
) => APIGatewayProxyStructuredResultV2 = (
    statusCode: number,
    message: string
) => {
    return {
        headers: { 'content-type': 'application/json' },
        statusCode,
        body: JSON.stringify({ message }),
    }
}

/**
 * Return a JSON message
 * @param statusCode HTTP status code
 * @param body JSON body
 */
export const createJsonBody: (
    statusCode: number,
    body: any
) => APIGatewayProxyStructuredResultV2 = (
    statusCode: number,
    body: any
) => {
    return {
        headers: { 'content-type': 'application/json' },
        statusCode,
        body: JSON.stringify(body),
    }
}
