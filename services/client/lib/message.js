var AWS = require('aws-sdk');
var crypto = require('crypto');
var _ = require('lodash');
var config = require('./config');

function Message() {
  this.dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: config.REGION,
    endpoint: config.DYNAMODB_ENDPOINT
  });
  this.tableName = `${config.ENV_NAME}_Messages`;
}
module.exports = new Message();

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
Message.prototype.add = async function(message) {
  try {
    var id = message.time + ':' + crypto.randomBytes(7).toString('hex');

    await this.dynamoDB.put({
      TableName: this.tableName,
      Item: {
        room: message.room,
        username: message.username,
        avatar: message.avatar,
        content: JSON.stringify(message.content),
        time: message.time,
        message: id
      }
    }).promise();

    return id;
  } catch (e) {
    console.error(e);

    throw new Error('Failed to insert new user in database');
  }
};

/**
  * Fetch a list of the messages in a room
  *
  * @param {object} where
  *   @param {string} where.room
  *   @param {string} where.message
**/
Message.prototype.listFromRoom = async function(where) {
  var messages;

  try {
    messages = await this.dynamoDB.query({
      TableName: this.tableName,
      KeyConditionExpression: 'room = :room',
      Limit: 20,
      ExpressionAttributeValues: {
        ':room': where.room
      },
      ExclusiveStartKey: where.message ? where : undefined,
      ScanIndexForward: false // Always return newest items first
    }).promise();
  } catch (e) {
    console.error(e);

    throw e;
  }

  return {
    next: _.get(messages, 'LastEvaluatedKey'),
    messages: messages.Items.map(function(message) {
      return {
        message: message.message,
        avatar: message.avatar,
        username: message.username,
        content: JSON.parse(message.content),
        time: message.time,
        room: message.room
      };
    })
  };
};
