var AWS = require('aws-sdk');
var bcrypt = require('bcrypt');

function User() {
  this.saltRounds = 10;
  this.dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
  });
  this.tableName = `${process.env.ENV_NAME}_Users`;
}
module.exports = new User();

/**
  * Get a user by their username
  *
  * @param {string} username - Username of the user
  * @param {string} password - The user's password
**/
User.prototype.fetchByUsername = async function(username) {
  let details = null;

  try {
    details = await this.dynamoDB.get({
      TableName: this.tableName,
      Key: {
        username: username
      }
    }).promise();
  } catch (e) {
    throw new Error('Failed to lookup user by username');
  }

  return details.Item;
};

/**
  * Create a new user with given details
  *
  * @param {object} details
  *   @param {string} details.username
  *   @param {string} details.email
  *   @param {string} details.password
**/
User.prototype.create = async function(details) {
  const existingAccount = await this.fetchByUsername(details.username);

  if (existingAccount) {
    throw new Error('That username is taken already.');
  }

  const passwordHash = await bcrypt.hash(details.password, this.saltRounds);

  try {
    await this.dynamoDB.put({
      TableName: this.tableName,
      Item: {
        username: details.username,
        email: details.email,
        passwordHash: passwordHash
      }
    }).promise();
  } catch (e) {
    throw new Error('Failed to insert new user in database');
  }

  return 'Success';
};

/**
  * Authenticate a user who submits their username and plaintext password
  *
  * @param {object} details
  *   @param {string} details.username
  *   @param {string} details.password
**/
User.prototype.authenticate = async function(details) {
  const account = await this.fetchByUsername(details.username);

  if (!account) {
    throw new Error('No matching account found');
  }

  const passed = await bcrypt.compare(details.password, account.passwordHash);

  if (passed) {
    return {
      username: account.username,
      email: account.email
    };
  }

  return false;
};
