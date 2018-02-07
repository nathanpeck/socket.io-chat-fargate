var redis = require('redis');

function Presence() {
  this.client = redis.createClient({
    host: process.env.REDIS_ENDPOINT
  });
}
module.exports = new Presence();

/**
  * Remember a present user with their connection ID
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
Presence.prototype.upsert = function(connectionId, meta) {
  this.client.hset(
    'presence',
    connectionId,
    JSON.stringify({
      meta: meta,
      when: Date.now()
    }),
    function(err) {
      if (err) {
        console.error('Failed to store presence in redis: ' + err);
      }
    }
  );
};

/**
  * Remove a presence. Used when someone disconnects
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
Presence.prototype.remove = function(connectionId) {
  this.client.hdel(
    'presence',
    connectionId,
    function(err) {
      if (err) {
        console.error('Failed to remove presence in redis: ' + err);
      }
    }
  );
};

/**
  * Returns a list of present users, minus any expired
  *
  * @param {function} returnPresent - callback to return the present users
**/
Presence.prototype.list = function(returnPresent) {
  var active = [];
  var dead = [];
  var now = Date.now();
  var self = this;

  this.client.hgetall('presence', function(err, presence) {
    if (err) {
      console.error('Failed to get presence from Redis: ' + err);
      return returnPresent([]);
    }

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
  });
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
