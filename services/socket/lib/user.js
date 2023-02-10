import config from './config.js'
import bcrypt from 'bcrypt'
import * as DB from './db.js'

const SALT_ROUNDS = 10

/**
  * Get a user by their username
  *
  * @param {string} username - Username of the user
  * @param {string} password - The user's password
**/
export const fetchByUsername = async function (username) {
  let details = null

  try {
    details = await DB.get({
      TableName: config.USER_TABLE,
      Key: {
        username
      }
    })
  } catch (e) {
    console.error(e)

    throw new Error('Failed to lookup user by username')
  }

  return details.Item
}

/**
  * Create a new user with given details
  *
  * @param {object} details
  *   @param {string} details.username
  *   @param {string} details.email
  *   @param {string} details.password
**/
export const create = async function (details) {
  const existingAccount = await fetchByUsername(details.username)

  if (existingAccount) {
    throw new Error('That username is taken already.')
  }

  let passwordHash = null

  try {
    passwordHash = await bcrypt.hash(details.password, SALT_ROUNDS)
  } catch (e) {
    console.error(e)
    throw e
  }

  try {
    await DB.put({
      TableName: config.USER_TABLE,
      Item: {
        username: details.username,
        email: details.email,
        passwordHash
      }
    })
  } catch (e) {
    console.error(e)

    throw new Error('Failed to insert new user in database')
  }

  return 'Success'
}

/**
  * Authenticate a user who submits their username and plaintext password
  *
  * @param {object} details
  *   @param {string} details.username
  *   @param {string} details.password
**/
export const authenticate = async function (details) {
  const account = await fetchByUsername(details.username)

  if (!account) {
    throw new Error('No matching account found')
  }

  const passed = await bcrypt.compare(details.password, account.passwordHash)

  if (passed) {
    return {
      username: account.username,
      email: account.email
    }
  }

  return false
}
