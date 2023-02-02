import { redis } from './redis.js'

/**
  * Remember a present user with their connection ID
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
export const upsert = async function (connectionId, meta) {
  await redis.hSet('presence', connectionId,
    JSON.stringify({
      meta,
      when: Date.now()
    })
  )
}

/**
  * Remove a presence. Used when someone disconnects
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
export const remove = async function (connectionId) {
  await redis.hDel('presence', connectionId)
}

/**
  * Returns a list of present users, minus any expired
  *
**/
export const list = async function () {
  const active = []
  const dead = []
  const now = Date.now()

  const presence = await redis.hGetAll('presence')

  for (const connection in presence) {
    const details = JSON.parse(presence[connection])
    details.connection = connection

    if (now - details.when > 8000) {
      dead.push(details)
    } else {
      active.push(details)
    }
  }

  if (dead.length) {
    clean(dead)
  }

  return active
}

/**
  * Cleans a list of connections by removing expired ones
  *
  * @param {array} toDelete - A list of expired presences to remove
**/
const clean = function (toDelete) {
  console.log(`Cleaning ${toDelete.length} expired presences`)
  for (const presence of toDelete) {
    remove(presence.connection)
  }
}
