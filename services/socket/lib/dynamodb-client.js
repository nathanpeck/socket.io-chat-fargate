// Create service client module using ES6 syntax.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import config from './config.js'

// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({
  endpoint: config.DYNAMODB_ENDPOINT
})
export { ddbClient }
