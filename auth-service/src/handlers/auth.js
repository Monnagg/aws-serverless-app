import jwt from 'jsonwebtoken';

// By default, API Gateway authorizations are cached (TTL) for 300 seconds.
// This policy will authorize all requests to the same API Gateway instance where the
// request is coming from, thus being efficient and optimising costs.
const generatePolicy = (principalId, methodArn) => {
  console.log('methodArn', methodArn);
  const apiGatewayWildcard = methodArn.split('/', 2).join('/') + '/*';
  console.log('apiGatewayWildcard', apiGatewayWildcard);

  return {
    principalId,//作为身份验证的主体标识。
    policyDocument: {//包含一个策略文档对象，其中包含一个版本信息和一个声明数组。
      Version: '2012-10-17',
      Statement: [//声明数组，每个声明描述了允许或拒绝对特定资源执行的操作。
        {
          Action: 'execute-api:Invoke',//描述执行的操作，此处为执行 API 调用。
          Effect: 'Allow',//指定允许还是拒绝对资源的访问，此处为允许。
          Resource: apiGatewayWildcard,//描述被授权的资源，此处为先前构建的通配符资源字符串。
        },
      ],
    },
  };
};

export async function handler(event, context) {
  if (!event.authorizationToken) {
    throw 'Unauthorized';
  }

  const token = event.authorizationToken.replace('Bearer ', '');

  try {
    console.log('token', token);
    const claims = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY);
    const policy = generatePolicy(claims.sub, event.methodArn);
    console.log("policy", policy);
    console.log("claims", claims);

    return {
      ...policy,
      context: claims
    };
  } catch (error) {
    console.log(error);
    throw 'Unauthorized';
  }
};
