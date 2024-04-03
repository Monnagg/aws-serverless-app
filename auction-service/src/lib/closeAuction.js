import AWS from 'aws-sdk'; // 引入 AWS SDK
const dynamodb = new AWS.DynamoDB.DocumentClient(); // 创建 DynamoDB 客户端
const sqs = new AWS.SQS(); // 创建 SQS 客户端

export async function closeAuction(auction) {
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME, // 指定表名
        Key: { id: auction.id }, // 指定主键
        UpdateExpression: 'set #status = :status', // 指定更新表达式
        ExpressionAttributeValues: {
            ':status': 'CLOSED', // 设置状态为 CLOSED
        },
        ExpressionAttributeNames: {
            '#status': 'status', // 定义属性名
        },
    };
    await dynamodb.update(params).promise(); // 使用 update 方法更新拍卖品
   const { title, seller, highestBid } = auction; // 从拍卖品中提取标题、卖家和最高出价
   const { amount, bidder } = highestBid; // 从最高出价中提取出价和出价者
    if(amount === 0) { // 如果没有出价
        await sqs.sendMessage({ // 发送消息
            QueueUrl: process.env.MAIL_QUEUE_URL, // 指定队列 URL
            MessageBody: JSON.stringify({ // 指定消息体
                subject: 'No bids on your auction item :(', // 指定主题
                recipient: seller, // 指定收件人
                body: `Oh no! Your item "${title}" didn't get any bids. Better luck next time!`, // 指定正文
            }),
        }).promise();
        return;
    }

   const notifySeller = sqs.sendMessage({ // 通知卖家
       QueueUrl: process.env.MAIL_QUEUE_URL, // 指定队列 URL
       MessageBody: JSON.stringify({ // 指定消息体
           subject: 'Your item has been sold!', // 指定主题
           recipient: seller, // 指定收件人
           body: `Woohoo! Your item "${title}" has been sold for $${amount}.`, // 指定正文
       }),
   }).promise();

   const notifyBidder = sqs.sendMessage({ // 通知出价者
       QueueUrl: process.env.MAIL_QUEUE_URL, // 指定队列 URL
       MessageBody: JSON.stringify({ // 指定消息体
           subject: 'You won an auction!', // 指定主题
           recipient: bidder, // 指定收件人
           body: `What a great deal! You got yourself a "${title}" for $${amount}.`, // 指定正文
       }),
   }).promise();

   return Promise.all([notifySeller, notifyBidder]); // 返回两个 Promise 的组合
}