import AWS from 'aws-sdk'
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'

import { ApiHandler } from 'sst/node/api'
import { Table } from 'sst/node/table'
import { useSession } from 'sst/node/auth'

import { createJsonBody, createJsonMessage } from '@air-quality-sst/core/util'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

/**
 * Takes a deviceId and registers it to a user if it has not been registered
 *
 * @param deviceId
 *
 * @returns
 *  409 if already registered
 *  200 for success
 */
export const registerDevice: APIGatewayProxyHandlerV2 = ApiHandler(
    async (event) => {
        const session = useSession()

        // Check user is authenticated
        if (session.type !== 'user') {
            return createJsonMessage(401, 'Unauthorized')
        }

        const data = JSON.parse(event?.body || '')
        if (!data?.deviceId) {
            createJsonMessage(400, 'deviceId is required')
        }

        console.log(session)

        // Register device if not registered
        const params = {
            TableName: Table.DeviceAdmins.tableName,
            Item: {
                deviceId: data.deviceId,
                adminId: session.properties.userID,
            },
            ConditionExpression: 'attribute_not_exists(deviceId)',
        }

        // Return result
        try {
            const results = await dynamoDb.put(params).promise()
            return createJsonBody(201, results)
        } catch (err: any) {
            if (err.code === 'ConditionalCheckFailedException') {
                return createJsonMessage(409, 'Device already registered')
            } else {
                console.log(err)
                return createJsonMessage(500, 'Internal Server Error')
            }
        }
    }
)
