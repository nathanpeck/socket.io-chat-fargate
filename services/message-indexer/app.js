'use strict'
const { defaultProvider } = require('@aws-sdk/credential-provider-node') // V3 SDK.
const { Client } = require('@opensearch-project/opensearch')
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws')

const client = new Client({
  ...AwsSigv4Signer({
    region: process.env.AWS_REGION,
    service: 'aoss', // 'aoss' for OpenSearch Serverless
    // Must return a Promise that resolve to an AWS.Credentials object.
    // This function is used to acquire the credentials when the client start and
    // when the credentials are expired.
    // The Client will refresh the Credentials only when they are expired.
    // With AWS SDK V2, Credentials.refreshPromise is used when available to refresh the credentials.

    // Example with AWS SDK V3:
    getCredentials: () => {
      // Any other method to acquire a new Credentials object can be used.
      const credentialsProvider = defaultProvider()
      return credentialsProvider()
    }
  }),
  node: process.env.MESSAGE_COLLECTION_ENDPOINT
})

/**
 * Example event coming in from the stream
 *
 * {
    "Records": [
        {
            "eventID": "eb3730ac319f06a4552b91a600083d5f",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-west-2",
            "dynamodb": {
                "ApproximateCreationDateTime": 1675812482,
                "Keys": {
                    "message": {
                        "S": "1675812482906:3d39a121bf5872"
                    },
                    "room": {
                        "S": "lambda"
                    }
                },
                "NewImage": {
                    "avatar": {
                        "S": "https://www.gravatar.com/avatar/13764f67b6bf4f47581b57800e719ab9?d=retro"
                    },
                    "time": {
                        "N": "1675812482906"
                    },
                    "message": {
                        "S": "1675812482906:3d39a121bf5872"
                    },
                    "content": {
                        "S": "{\"text\":\"Testing the DynamoDB stream\"}"
                    },
                    "room": {
                        "S": "lambda"
                    },
                    "username": {
                        "S": "anonymous_83d396"
                    }
                },
                "SequenceNumber": "865100000000015469830115",
                "SizeBytes": 249,
                "StreamViewType": "NEW_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-west-2:228578805541:table/production_Messages/stream/2023-02-07T17:11:32.070"
        }
    ]
}
 */

// Global variable ensures that we don't have to check
// for index existing on every single invoke, just the first
let indexExists = false

exports.handler = async (event) => {
  const INDEX_NAME = 'chat-messages'

  if (!indexExists) {
    console.log('Ensuring index exists')
    indexExists = await client.indices.exists({
      index: INDEX_NAME
    })

    if (!indexExists) {
      try {
        const settings = {
          settings: {
            index: {
              number_of_shards: 4,
              number_of_replicas: 2
            }
          }
        }

        const response = await client.indices.create({
          index: INDEX_NAME,
          body: settings
        })
        console.log(response.body)
      } catch (e) {
        console.log(e)
      }
    }
  }

  console.log('Adding messages to index')

  // TODO: Rewrite this to use the bulk API for faster performance:
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html
  for (const record of event.Records) {
    const response = await client.index({
      id: record.dynamodb.Keys.room.S + ':' + record.dynamodb.Keys.message.S,
      index: INDEX_NAME,
      body: {
        room: record.dynamodb.Keys.room.S,
        message: record.dynamodb.Keys.message.S,
        avatar: record.dynamodb.NewImage.avatar.S,
        time: record.dynamodb.NewImage.time.S,
        content: JSON.parse(record.dynamodb.NewImage.content.S).text,
        username: record.dynamodb.NewImage.username.S
      }
    })
    console.log(response)
  }
}
