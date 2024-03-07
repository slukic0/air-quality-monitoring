import { DynamoDB } from 'aws-sdk';

const executePaginatedQuery = async(dynamoDb: DynamoDB.DocumentClient, params: DynamoDB.DocumentClient.QueryInput) => {
    const results = [];
    do {
        const { Items, LastEvaluatedKey } = await dynamoDb.query(params).promise()
        if (LastEvaluatedKey){
            params.ExclusiveStartKey = LastEvaluatedKey;
        } else {
            delete params.ExclusiveStartKey;
        }
        if (Items){
            results.push(...Items);
        }
    } while (params.ExclusiveStartKey)
    return results;
}

export default executePaginatedQuery;