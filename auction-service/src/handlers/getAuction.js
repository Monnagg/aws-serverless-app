import AWS from 'aws-sdk'; // 引入 AWS SDK
import commonMiddleware from '../lib/commonGetMiddleware'; // 引入自定义中间件
import createError from 'http-errors'; // 引入错误生成器


const dynamodb = new AWS.DynamoDB.DocumentClient(); // 创建 DynamoDB 客户端

export async function getAuctionById(id) {
  let auction;
  try {
    const result = await dynamodb.get({ // 使用 get 方法获取拍卖品
      TableName: process.env.AUCTIONS_TABLE_NAME, // 指定表名
      Key: { id }, // 指定主键
    }).promise(); // 使用 promise 方法确保操作完成
    auction = result.Item; // 将结果赋给 auction

  } catch (error) {
    console.error(error); // 打印错误
    throw new createError.InternalServerError(error); // 抛出内部服务器错误
  }

  if (!auction) { // 如果拍卖品不存在
    throw new createError.NotFound(`Auction with ID "${id}" not found.`); // 抛出未找到错误
  }
  return auction;
}
// 创建拍卖品的异步函数
async function getAuction(event, context) {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  return {
    statusCode: 200, // 返回 HTTP 状态码 201 表示创建成功
    body: JSON.stringify({ auction }), // 返回创建的拍卖品对象
  };
}

export const handler = commonMiddleware(getAuction);

