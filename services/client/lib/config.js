const config = {
  ENV_NAME: process.env.ENV_NAME,

  PORT: process.env.PORT || 3000,
  REGION: process.env.REGION || 'us-east-1',

  REDIS_ENDPOINT: process.env.REDIS_ENDPOINT,
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,

  USER_TABLE: process.env.USER_TABLE,
  MESSAGE_TABLE: process.env.MESSAGE_TABLE,

  // Controls how often clients ping back and forth
  HEARTBEAT_TIMEOUT: 8000,
  HEARTBEAT_INTERVAL: 4000
}

config.SELF_URL = process.env.SELF_URL || 'http://localhost:' + config.PORT

export default config
