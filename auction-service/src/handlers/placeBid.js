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
   const { email } = event.requestContext.authorizer;
   const auction = await getAuctionById(id);
   
    if(email === auction.seller) {
      throw new createError.Forbidden(`You cannot bid on your own auctions!`);
    }
    if (email == auction.highestBid.bidder) {
      throw new createError.Forbidden(`You You are already the highest bidder`);
   }
if(auction.status !== 'OPEN') {
  throw new createError.Forbidden(`You cannot bid on closed auctions!`);
}
   if(amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
   }
   const params = {
     TableName: process.env.AUCTIONS_TABLE_NAME,
     Key: { id },
     UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
     ExpressionAttributeValues: {
       ':amount': amount,
       ':bidder': email,
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


