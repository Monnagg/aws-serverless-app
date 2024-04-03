import AWS from 'aws-sdk'; // 引入 AWS SDK
import commonMiddleware from '../lib/commonGetMiddleware';
import validator from '@middy/validator'; // 引入验证器
import { transpileSchema } from '@middy/validator/transpile'
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema'; // 引入验证模式
import createError from 'http-errors'; // 引入错误生成器


const dynamodb = new AWS.DynamoDB.DocumentClient(); // 创建 DynamoDB 客户端

// 创建拍卖品的异步函数
async function getAuctions(event, context) {
  const {status} = event.queryStringParameters;
    let auctions;
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME, 
        IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
            ':status': status,
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        },
    };
    try {
        const result = await dynamodb.query(params).promise(); 
        auctions = result.Items; 
    } catch (error) {
        console.error(error); 
        throw new createError.InternalServerError(error); 
    }
 
  // 返回创建成功的响应
  return {
    statusCode: 200, // 返回 HTTP 状态码 201 表示创建成功
    body: JSON.stringify({ auctions }), // 返回创建的拍卖品对象
  };
}

export const handler = commonMiddleware(getAuctions)
  .use(validator({ eventSchema: transpileSchema(getAuctionsSchema) })); 
