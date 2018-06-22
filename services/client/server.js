// Setup basic express server
var _ = require('lodash');
var crypto = require('crypto');
var express = require('express');
var compression = require('compression');
var path = require('path');
var enforce = require('express-sslify');
var config = require('./lib/config');

var app = express();

// GZIP compress resources served
app.use(compression());

// Force redirect to HTTPS if the protocol was HTTP
if (!process.env.LOCAL) {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
io.adapter(redis({ host: config.REDIS_ENDPOINT, port: 6379 }));

var Presence = require('./lib/presence');
var User = require('./lib/user');
var Message = require('./lib/message');

// Lower the heartbeat timeout (helps us expire disconnected people faster)
io.set('heartbeat timeout', config.HEARTBEAT_TIMEOUT);
io.set('heartbeat interval', config.HEARTBEAT_INTERVAL);

// Routing
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket) {
  // Initially the socket starts out as not authenticated
  socket.authenticated = false;

  Presence.list(function(users) {
    // Tell the socket how many users are present.
    io.to(socket.id).emit('presence', {
      numUsers: users.length
    });
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', async function(data, callback) {
    if (!socket.authenticated) {
      // Don't allow people not authenticated to send a message
      return callback('Can\'t send a message until you are authenticated');
    }

    if (!data.room || !_.isString(data.room)) {
      return callback('Must pass a parameter `room` which is a string');
    }

    if (!data.message || !_.isString(data.message)) {
      return callback('Must pass a parameter `message` which is a string');
    }

    var messageBody = {
      room: data.room,
      time: Date.now(),
      content: {
        text: data.message,
      },
      username: socket.username,
      avatar: socket.avatar
    };

    // Store the messages in DynamoDB
    messageBody.message = await Message.add(messageBody);

    socket.broadcast.emit('new message', messageBody);

    return callback(null, messageBody);
  });

  socket.on('message list', async function(from, callback) {
    var messages;

    if (!from.room || !_.isString(from.room)) {
      return callback('Must pass a parameter `from.room` which is a string');
    }

    try {
      messages = await Message.listFromRoom(from);
    } catch (e) {
      return callback(e);
    }

    return callback(null, messages);
  });

  socket.conn.on('heartbeat', function() {
    if (!socket.authenticated) {
      // Don't start counting as present until they authenticate.
      return;
    }

    Presence.upsert(socket.id, {
      username: socket.username
    });
  });

  // Client wants a list of rooms
  socket.on('room list', function(callback) {
    if (!_.isFunction(callback)) {
      return;
    }

    return callback(null, [
      {
        id: 'general',
        name: 'General AWS',
        preview: 'General AWS discussion',
        image: '/images/aws.jpg',
        status: 'none',
        onlineCount: 0
      },
      {
        id: 'fargate',
        name: 'AWS Fargate',
        preview: 'Containers without instances',
        image: '/images/fargate.png',
        status: 'none',
        onlineCount: 0
      },
      {
        id: 'eks',
        name: 'AWS EKS',
        preview: 'AWS managed Kubernetes masters',
        image: '/images/eks.png',
        status: 'none',
        onlineCount: 0
      },
      {
        id: 'ecs',
        name: 'AWS ECS',
        preview: 'AWS container orchestrator',
        image: '/images/ecs.png',
        status: 'none',
        onlineCount: 0
      }
    ]);
  });

  // Client wants to create a new account
  socket.on('create user', async function(details, callback) {
    if (!_.isFunction(callback)) {
      return;
    }

    if (socket.authenticated) {
      return callback('User already has a logged in identity');
    }

    if (!details.username || !_.isString(details.username)) {
      return callback('Must pass a parameter `username` which is a string');
    }

    if (!details.email || !_.isString(details.email)) {
      return callback('Must pass a parameter `email` which is a string');
    }

    if (!details.password || !_.isString(details.password)) {
      return callback('Must pass a parameter `password` which is a string');
    }

    details.password = details.password.trim().toLowerCase();
    details.username = details.username.trim().toLowerCase();
    details.email = details.email.trim().toLowerCase();

    try {
      await User.create({
        username: details.username,
        email: details.email,
        password: details.password
      });
    } catch (e) {
      return callback(e.toString());
    }

    // Set details on the socket.
    socket.authenticated = true;
    socket.username = details.username;
    socket.email = details.email;
    socket.avatar = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(socket.email).digest('hex');

    // Set the user as present.
    Presence.upsert(socket.id, {
      username: socket.username
    });
    socket.present = true;

    Presence.list(function(users) {
      socket.emit('login', {
        numUsers: users.length
      });

      // echo globally (all clients) that a person has connected
      io.emit('user joined', {
        username: socket.username,
        avatar: socket.avatar,
        numUsers: users.length
      });
    });

    return callback(null, {
      username: socket.username,
      avatar: socket.avatar
    });
  });

  // Client wants to authenticate a user
  socket.on('authenticate user', async function(details, callback) {
    if (!_.isFunction(callback)) {
      return;
    }

    if (socket.authenticated) {
      return callback('User already has a logged in identity');
    }

    if (!details.username || !_.isString(details.username)) {
      return callback('Must pass a parameter `username` which is a string');
    }

    if (!details.password || !_.isString(details.password)) {
      return callback('Must pass a parameter `password` which is a string');
    }

    details.password = details.password.trim().toLowerCase();
    details.username = details.username.trim().toLowerCase();

    var result;

    try {
      result = await User.authenticate({
        username: details.username,
        password: details.password
      });
    } catch (e) {
      return callback(e.toString());
    }

    if (!result) {
      return callback('No matching account found');
    }

    // Set the details on the socket.
    socket.authenticated = true;
    socket.username = result.username;
    socket.email = result.email;
    socket.avatar = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(socket.email).digest('hex');

    // Set the user as present.
    Presence.upsert(socket.id, {
      username: socket.username
    });
    socket.present = true;

    Presence.list(function(users) {
      socket.emit('login', {
        numUsers: users.length
      });

      // echo globally (all clients) that a person has connected
      io.emit('user joined', {
        username: socket.username,
        avatar: socket.avatar,
        numUsers: users.length
      });
    });

    return callback(null, {
      username: socket.username,
      avatar: socket.avatar
    });
  });

  socket.on('anonymous user', function(callback) {
    if (!_.isFunction(callback)) {
      return;
    }

    socket.authenticated = true;
    socket.username = 'anonymous_' + crypto.randomBytes(3).toString('hex');
    socket.avatar = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(socket.username).digest('hex') + '?d=retro';

    // Set the user as present.
    Presence.upsert(socket.id, {
      username: socket.username
    });
    socket.present = true;

    Presence.list(function(users) {
      socket.emit('login', {
        numUsers: users.length
      });

      // echo globally (all clients) that a person has connected
      io.emit('user joined', {
        username: socket.username,
        avatar: socket.avatar,
        numUsers: users.length
      });
    });

    return callback(null, {
      username: socket.username,
      avatar: socket.avatar
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function(room) {
    if (!socket.authenticated) {
      return;
    }

    socket.broadcast.emit('typing', {
      room: room,
      username: socket.username,
      avatar: socket.avatar
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function(room) {
    if (!socket.authenticated) {
      return;
    }

    socket.broadcast.emit('stop typing', {
      room: room,
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function() {
    if (socket.authenticated) {
      Presence.remove(socket.id);

      Presence.list(function(users) {
        // echo globally (all clients) that a person has left
        socket.broadcast.emit('user left', {
          username: socket.username,
          avatar: socket.avatar,
          numUsers: users.length
        });
      });
    }
  });
});

module.exports = server;
