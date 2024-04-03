import AWS from 'aws-sdk'; // 引入 AWS SDK

const dynamodb = new AWS.DynamoDB.DocumentClient(); // 创建 DynamoDB 客户端

export async function getEndedAuctions() {
    const now = new Date(); // 获取当前时间
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME, // 指定表名
        IndexName: 'statusAndEndDate', // 指定索引名
        KeyConditionExpression: '#status = :status AND endingAt <= :now', // 指定查询条件
        ExpressionAttributeValues: {
            ':status': 'OPEN', // 查询状态为 OPEN 的拍卖品
            ':now': now.toISOString(), // 查询结束时间早于当前时间的拍卖品
        },
        ExpressionAttributeNames: {
            '#status': 'status', // 定义查询条件中的属性名
        },
    };
    const result = await dynamodb.query(params).promise(); // 使用 query 方法查询拍卖品
    return result.Items; // 返回查询结果

}