import { v4 as uuid } from 'uuid'; // 引入 uuid 生成器
import AWS from 'aws-sdk'; // 引入 AWS SDK
import httpJsonBodyParser from '@middy/http-json-body-parser'; // 引入 JSON 解析器
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import createAuctionSchema from '../lib/schemas/createAuctionSchema.js'; // 引入验证模式
import commonMiddleware from '../lib/commonGetMiddleware'; // 引入自定义中间件
import createError from 'http-errors'; // 引入错误生成器



const dynamodb = new AWS.DynamoDB.DocumentClient(); // 创建 DynamoDB 客户端

// 创建拍卖品的异步函数
async function createAuction(event, context) {
  // 从事件体中解析出拍卖品标题
  const { title } = event.body;
  // 获取当前时间
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1); // 设置拍卖品结束时间为当前时间加 1 小时
  // 构建拍卖品对象
  const auction = {
    id: uuid(), // 使用 uuid 生成器生成唯一标识符
    title,
    status: 'OPEN', // 设置拍卖品状态为开放
    createdAt: now.toISOString(), // 记录创建时间
    endingAt: endDate.toISOString(), // 记录结束时间
    highestBid: { // 设置最高出价
      amount: 0,
    },
  };

  try {
    await dynamodb.put({ // 使用 put 方法将拍卖品对象写入数据库
      TableName: process.env.AUCTIONS_TABLE_NAME, // 指定表名
      Item: auction, // 指定写入的数据
    }).promise(); // 使用 promise 方法确保操作完成
  
  } catch (error) {
    console.error(error); // 打印错误
    throw new createError.InternalServerError(error); // 抛出内部服务器错误
    
  }

 
  // 返回创建成功的响应
  return {
    statusCode: 201, // 返回 HTTP 状态码 201 表示创建成功
    body: JSON.stringify({ auction }), // 返回创建的拍卖品对象
  };
}

// 将 createAuction 函数导出为 handler
export const handler = commonMiddleware(createAuction)
  .use(httpJsonBodyParser())
  .use(validator({eventSchema: transpileSchema(createAuctionSchema)})); // 使用验证器验证事件体
  
