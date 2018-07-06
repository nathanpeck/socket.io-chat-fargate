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

  this.SNS = new AWS.SNS({
    region: config.REGION,
    endpoint: config.SNS_ENDPOINT
  });
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
  var id = message.time + ':' + crypto.randomBytes(7).toString('hex');

  try {
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
  } catch (e) {
    console.error(e);
    throw new Error('Failed to insert new message in database');
  }

  // Publish onto the SNS topic so that subscribing services get notified
  // Happens aysnchronously and does not block the return.
  try {
    this.SNS.publish({
      Message: JSON.stringify({
        room: message.room,
        username: message.username,
        avatar: message.avatar,
        content: message.content,
        time: message.time,
        message: id
      }),
      TopicArn: config.MESSAGE_SENT_SNS_ARN
    }).promise();
  } catch (e) {
    console.error(e);
    throw new Error('Failed to publish MessageSent notification');
  }

  return id;
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
