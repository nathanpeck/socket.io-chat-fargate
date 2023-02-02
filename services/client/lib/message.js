import crypto from 'crypto'
import _ from 'lodash'
import config from './config.js'
import * as DB from './db.js'

/**
  * Add a message to a room
  *
  * @param {object} message
  *   @param {string} message.room
  *   @param {string} message.username
  *   @param {string} message.avatar
  *   @param {object} message.content
  *   @param {Date} message.time
**/
export const add = async function (message) {
  try {
    const id = message.time + ':' + crypto.randomBytes(7).toString('hex')

    await DB.put({
      TableName: config.MESSAGE_TABLE,
      Item: {
        room: message.room,
        username: message.username,
        avatar: message.avatar,
        content: JSON.stringify(message.content),
        time: message.time,
        message: id
      }
    })

    return id
  } catch (e) {
    console.error(e)

    throw new Error('Failed to insert new user in database')
  }
}

/**
  * Fetch a list of the messages in a room
  *
  * @param {object} where
  *   @param {string} where.room
  *   @param {string} where.message
**/
export const listFromRoom = async function (where) {
  let messages

  try {
    messages = await DB.query({
      TableName: config.MESSAGE_TABLE,
      KeyConditionExpression: 'room = :room',
      Limit: 20,
      ExpressionAttributeValues: {
        ':room': where.room
      },
      ExclusiveStartKey: where.message ? where : undefined,
      ScanIndexForward: false // Always return newest items first
    })
  } catch (e) {
    console.error(e)

    throw e
  }

  return {
    next: _.get(messages, 'LastEvaluatedKey'),
    messages: messages.Items.map(function (message) {
      return {
        message: message.message,
        avatar: message.avatar,
        username: message.username,
        content: JSON.parse(message.content),
        time: message.time,
        room: message.room
      }
    })
  }
}
