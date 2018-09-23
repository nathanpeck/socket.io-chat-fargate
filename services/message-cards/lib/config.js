module.exports = {
  ENV_NAME: process.env.ENV_NAME,
  REGION: process.env.REGION || 'us-east-1',

  REDIS_ENDPOINT: process.env.REDIS_ENDPOINT,
  SQS_ENDPOINT: process.env.SQS_ENDPOINT,

  QUEUE_URL: process.env.QUEUE_URL
};
