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
 */
exports.handler = async (event) => {
  console.log(event)

  const searchTerm = 'index'
  const INDEX_NAME = 'chat-messages'

  console.log(`Searching for search term ${searchTerm}`)

  const response = await client.search({
    index: INDEX_NAME,
    body: {
      query: {
        match: {
          content: {
            query: searchTerm
          }
        }
      }
    }
  })

  console.log(response)
}
