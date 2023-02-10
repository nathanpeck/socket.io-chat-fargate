import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { ddbClient } from './dynamodb-client.js'

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: false, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: false // false, by default.
}

const unmarshallOptions = {
  // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
  wrapNumbers: false // false, by default.
}

const translateConfig = { marshallOptions, unmarshallOptions }

// Create the DynamoDB Document client.
const DynamoDB = DynamoDBDocumentClient.from(ddbClient, translateConfig)

export { DynamoDB }
