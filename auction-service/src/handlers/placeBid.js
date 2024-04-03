import AWS from 'aws-sdk'; // 引入 AWS SDK
import commonMiddleware from '../lib/commonPostMiddleware'; // 引入自定义中间件
import createError from 'http-errors'; // 引入错误生成器
import { getAuctionById } from './getAuction';
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import placeBidSchema from '../lib/schemas/placeBidSchema'; // 引入验证模式


const dynamodb = new AWS.DynamoDB.DocumentClient(); 

async function placeBid(event, context) {
   const { id } = event.pathParameters;
   const { amount } = event.body;
   const auction = await getAuctionById(id);
//    if (auction && auction.highestBid) {
//     // 执行代码以访问 highestBid 属性
// } else {
//     console.log("auction 对象或 highestBid 属性未定义");
// }
if(auction.status !== 'OPEN') {
  throw new createError.Forbidden(`You cannot bid on closed auctions!`);
}
   if(amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
   }
   const params = {
     TableName: process.env.AUCTIONS_TABLE_NAME,
     Key: { id },
     UpdateExpression: 'set highestBid.amount = :amount',
     ExpressionAttributeValues: {
       ':amount': amount,
     },
     ReturnValues: 'ALL_NEW',
   };
   let updatedAuction;
   try {
     const result = await dynamodb.update(params).promise();
     updatedAuction = result.Attributes;
   } catch (error) {
     console.error(error);
     throw new createError.InternalServerError(error);
   }

  
  return {
    statusCode: 200, 
    body: JSON.stringify({ updatedAuction }), 
  };
}

export const handler = commonMiddleware(placeBid)
  .use(validator({ eventSchema: transpileSchema(placeBidSchema) }));


