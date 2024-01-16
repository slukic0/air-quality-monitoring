import AWS from 'aws-sdk'
import { Table } from 'sst/node/table'
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { ApiHandler, usePathParams, useQueryParams } from 'sst/node/api'
import { createJsonMessage, createJsonBody } from '@air-quality-sst/core/util'
import { useSession } from 'sst/node/auth'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

/**
 *  List users by specifiying the start of their email address
 */
export const getUsers: APIGatewayProxyHandlerV2 = ApiHandler(async (event) => {
    const session = useSession()
    const { emailString } = usePathParams()

    // Check user is authenticated
    if (session.type !== 'user') {
        return createJsonMessage(401, 'Unauthorized')
    }

    if (typeof emailString !== 'string') {
        return createJsonMessage(400, 'emailString is required')
    }

    const queryParams = {
        TableName: Table.Users.tableName,
        IndexName: 'emailLetterIndex',
        KeyConditionExpression: 'emailFirstLetter = :emailFirstLetter',
        FilterExpression: 'begins_with(email, :emailString)',
        ExpressionAttributeValues: {
            ':emailFirstLetter': emailString.at(0),
            ':emailString': emailString,
        },
        ProjectionExpression: 'userId, email, #givenName',
        ExpressionAttributeNames: {
            "#givenName": "name"
          }
    }
    const { Items } = await dynamoDb.query(queryParams).promise()

    return createJsonBody(201, Items)
})
