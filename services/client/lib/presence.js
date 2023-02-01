var config = require('./config');
import { redis } from './lib/redis.js';

function Presence() {
  this.client = redis.createClient({
    host: config.REDIS_ENDPOINT
  });
}
module.exports = new Presence();

/**
  * Remember a present user with their connection ID
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
Presence.prototype.upsert = async function(connectionId, meta) {
  await this.client.hSet('presence', connectionId,
    JSON.stringify({
      meta: meta,
      when: Date.now()
    })
  );
};

/**
  * Remove a presence. Used when someone disconnects
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
Presence.prototype.remove = async function(connectionId) {
  await this.client.hDel('presence', connectionId);
};

/**
  * Returns a list of present users, minus any expired
  *
  * @param {function} returnPresent - callback to return the present users
**/
Presence.prototype.list = async function(returnPresent) {
  var active = [];
  var dead = [];
  var now = Date.now();
  var self = this;

  const presence = await this.client.hGetAll('presence');

  for (var connection in presence) {
    var details = JSON.parse(presence[connection]);
    details.connection = connection;

    if (now - details.when > 8000) {
      dead.push(details);
    } else {
      active.push(details);
    }
  }

  if (dead.length) {
    self._clean(dead);
  }

  return returnPresent(active);
};

/**
  * Cleans a list of connections by removing expired ones
  *
  * @param
**/
Presence.prototype._clean = function(toDelete) {
  console.log(`Cleaning ${toDelete.length} expired presences`);
  for (var presence of toDelete) {
    this.remove(presence.connection);
  }
};
