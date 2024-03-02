import { Table } from "sst/node/table";

const createGetUserGetItemParams = (userId: String) => ({
    TableName: Table.Users.tableName,
    Key: { userId },
    ProjectionExpression: 'userId, email, #givenName, adminDevices, authorizedDevices',
    ExpressionAttributeNames: {
      '#givenName': 'name',
    },
});

export default createGetUserGetItemParams;