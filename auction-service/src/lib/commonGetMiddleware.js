import middy from '@middy/core'; // 引入 middy
import httpEventNormalizer from '@middy/http-event-normalizer'; // 引入事件规范化器
import httpErrorHandler from '@middy/http-error-handler'; // 引入错误处理器

export default handler => middy(handler)
    .use([
        httpEventNormalizer(),
        httpErrorHandler(),
    ]);