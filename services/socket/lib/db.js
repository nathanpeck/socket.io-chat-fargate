// This database wrapper helper methods to make interacting with DynamoDB
// a little bit easier. It automatically retires with backoff when there are
// throughput limit exceptions, and it automates making followup calls when
// a batch has unprocessed keys

import pkg from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from './dynamodb-doc-client.js'
import retry from 'async/retry.js'

const {
  GetCommand,
  QueryCommand,
  PutCommand,
  BatchGetCommand,
  BatchWriteCommand,
  UpdateCommand,
  TransactWriteCommand
} = pkg

const RETRYABLE_ERROR_CODES = {
  // Generic retryable DynamoDB error codes
  ItemCollectionSizeLimitExceededException: true,
  LimitExceededException: true,
  ProvisionedThroughputExceededException: true,
  RequestLimitExceeded: true,
  ResourceInUseException: true,
  ThrottlingException: true,
  UnrecognizedClientException: true,
  // DAX specific retryable errors
  NeedMoreData: true,
  'Not enough data': true
}

// Errors which are expected possibilities, not to alert on
const EXPECTED_ERROR_CODES = {
  ConditionalCheckFailedException: true
}

export const retryable = function (err) {
  if (err.name && EXPECTED_ERROR_CODES[err.name]) {
    // This is an expected error, let it throw for higher level handling
    return false
  }

  // An error code that came back from the API, but
  // this was an ephemeral error that we can retry
  if (err.name && RETRYABLE_ERROR_CODES[err.name]) {
    console.error('Retryable DynamoDB error: ' + err.code)
    return true
  }

  // Identify error based on type
  if (err.name && RETRYABLE_ERROR_CODES[typeof err]) {
    console.error('Retryable DynamoDB error: ' + typeof err)
    return true
  }

  // Identify error based on message
  if (err.message && RETRYABLE_ERROR_CODES[err.message]) {
    console.error('Retryable DynamoDB error: ' + err.message)
    return true
  }

  // console.error('Unexpected, unretryable DynamoDB error: ', err)
  return false
}

// Define the policy for whether or not to retry, how long to wait, and how many times
export const getDefaultRetryPolicy = function () {
  return {
    times: 4,
    interval: exponentialBackoff,
    errorFilter: retryable
  }
}

// Exponential backoff function
// 50ms, 100ms, 200ms, 400ms, etc
export const exponentialBackoff = function (retryCount) {
  return 25 * Math.pow(2, retryCount)
}

// For fetches that take multiple DynamoDB API calls to fetch
// the full set, this helper function combines the result sets
// into one response.
export const combineResultSets = function (setOne, setTwo) {
  const combinedResults = {}

  for (const table in setTwo) {
    if (setOne[table]) {
      combinedResults[table] = setOne[table].concat(setTwo[table])
    } else {
      combinedResults[table] = setTwo[table]
    }
  }

  return combinedResults
}

export const batchGet = async function (query) {
  return await retry(
    getDefaultRetryPolicy(),
    async function attemptBatchGet () {
      const results = await DynamoDB.send(new BatchGetCommand(query))

      // All results were fetched, so fast return.
      if (!results.UnprocessedKeys || Object.keys(results.UnprocessedKeys).length === 0) {
        return results
      }

      const moreResults = await batchGet({
        RequestItems: results.UnprocessedKeys
      })

      return combineResultSets(results, moreResults)
    }
  )
}

export const batchPut = async function (query) {
  return await retry(
    getDefaultRetryPolicy(),
    async function attemptBatchGet () {
      const results = await DynamoDB.send(new BatchWriteCommand(query))

      // All results were stored, so fast return.
      if (!results.UnprocessedKeys || Object.keys(results.UnprocessedKeys).length === 0) {
        return
      }

      // Partial success, but there were some unprocessed keys
      // we need to retry the put on.
      await batchPut({
        RequestItems: results.UnprocessedKeys
      })
    }
  )
}

export const put = async function (query) {
  return await retry(
    getDefaultRetryPolicy(),
    async function attemptPut () {
      return await DynamoDB.send(new PutCommand(query))
    }
  )
}

export const update = async function (query) {
  const results = await retry(
    getDefaultRetryPolicy(),
    async function attemptPut () {
      return await DynamoDB.send(new UpdateCommand(query))
    }
  )

  return results.Attributes
}

export const get = async function (query) {
  const results = await retry(
    getDefaultRetryPolicy(),
    async function attemptGet () {
      return await DynamoDB.send(new GetCommand(query))
    }
  )

  return results.Item
}

export const query = async function (query) {
  return await retry(
    getDefaultRetryPolicy(),
    async function attemptQuery () {
      return await DynamoDB.send(new QueryCommand(query))
    }
  )
}

export const transact = async function (query) {
  return await retry(
    getDefaultRetryPolicy(),
    async function attemptQuery () {
      return await DynamoDB.send(new TransactWriteCommand(query))
    }
  )
}
