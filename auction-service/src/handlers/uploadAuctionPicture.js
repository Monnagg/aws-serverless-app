import { getAuctionById } from './getAuction';
import { uploadPictureToS3 } from '../lib/uploadPictureToS3';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl';
import validator from '@middy/validator';
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema';
import { transpileSchema } from '@middy/validator/transpile';
import cors from '@middy/http-cors'; // 引入跨域资源共享



export async function uploadAuctionPicture(event){
    const {id} = event.pathParameters;
    const auction = await getAuctionById(id);
    const {email} = event.requestContext.authorizer;
    //检查用户是否是拍卖品的拥有者
    if(auction.seller !== email){
        throw new createError.Forbidden(`You are not the seller of this auction!`);
    }


    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    let updatedAuction;

    try {
        const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer);
        updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
  

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };

}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler())
    //.use(validator({ eventSchema: transpileSchema(uploadAuctionPictureSchema) }))
    .use(cors());