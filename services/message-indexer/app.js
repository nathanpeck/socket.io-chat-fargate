'use strict'
const { defaultProvider } = require('@aws-sdk/credential-provider-node') // V3 SDK.
const { Client } = require('@opensearch-project/opensearch')
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws')

const client = new Client({
  ...AwsSigv4Signer({
    region: 'us-east-1',
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
  node: 'https://xxx.region.aoss.amazonaws.com'
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

exports.handler = async (event) => {
  // Lambda handler code
  console.log(JSON.stringify(event, 0, null))

  console.log('Adding document:')

  const document = {
    title: 'The Outsider',
    author: 'Stephen King',
    year: '2018',
    genre: 'Crime fiction'
  }

  const id = '1'

  const response = await client.index({
    id,
    index: index_name,
    body: document,
    refresh: true
  })

  console.log(response.body)
}
