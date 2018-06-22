var request = require('request-promise-native');
var expect = require('chai').expect;
var socketClient = require('socket.io-client');
var config = require('./config');

var client = request.defaults({
  baseUrl: config.SELF_URL,
  resolveWithFullResponse: true
});

describe('The application server', function() {
  it('should serve webpages over HTTP', async function() {
    var result = await client.get('index.html');
    expect(result.statusCode).to.equal(200);
  });

  it('should have a socket.io server', async function() {
    var socket = socketClient(config.SELF_URL);

    await new Promise(function(resolve) {
      socket.on('connect', resolve);
    });

    socket.disconnect();
  });
});

describe('The API', function() {
  var socket;
  var newSocket;

  it('should accept a connection and emit "presence" to it', function(done) {
    var callbacks = 2;
    socket = socketClient(config.SELF_URL);

    var end = function() {
      socket.off('presence');
      done();
    };

    socket.on('connect', function() {
      --callbacks > 0 || end();
    });

    socket.on('presence', function(presence) {
      expect(presence).to.be.an('object');
      expect(presence).to.have.property('numUsers');
      expect(presence.numUsers).to.equal(0);

      --callbacks > 0 || end();
    });
  });

  it('should respond to "room list" with a list of rooms', function(done) {
    socket.emit('room list', function(err, results) {
      expect(err).to.equal(null);
      expect(results).to.be.an('array');

      for (var room of results) {
        expect(room).to.be.an('object');

        expect(room).to.have.property('id');
        expect(room.id).to.be.a('string');

        expect(room).to.have.property('name');
        expect(room.name).to.be.a('string');

        expect(room).to.have.property('image');
        expect(room.image).to.be.a('string');

        expect(room).to.have.property('status');
        expect(room.status).to.be.a('string');

        expect(room).to.have.property('onlineCount');
        expect(room.onlineCount).to.be.a('number');
      }

      done();
    });
  });

  it('should reject "new message" from unauthenticated users', function(done) {
    socket.emit('new message', { foo: 'bar' }, function(err) {
      expect(err).to.be.a('string');
      expect(err).to.equal('Can\'t send a message until you are authenticated');
      done();
    });
  });

  it('should handle "anonymous user" properly', function(done) {
    var callbacks = 2;

    var end = function() {
      socket.off('user joined');
      done();
    };

    socket.emit('anonymous user', function(err, results) {
      expect(err).to.equal(null);
      expect(results).to.be.an('object');

      expect(results).to.have.property('username');
      expect(results.username).to.be.a('string');

      expect(results).to.have.property('avatar');
      expect(results.avatar).to.be.a('string');

      --callbacks > 0 || end();
    });

    socket.on('user joined', function(details) {
      expect(details).to.be.an('object');

      expect(details).to.have.property('username');
      expect(details.username).to.be.a('string');

      expect(details).to.have.property('avatar');
      expect(details.avatar).to.be.a('string');

      expect(details).to.have.property('numUsers');
      expect(details.numUsers).to.equal(1);

      --callbacks > 0 || end();
    });
  });

  it('when another client connect server should emit correct "presence"', function(done) {
    newSocket = socketClient(config.SELF_URL);

    newSocket.on('presence', function(presence) {
      expect(presence).to.be.an('object');
      expect(presence).to.have.property('numUsers');
      expect(presence.numUsers).to.equal(1);

      newSocket.off('presence');
      done();
    });
  });

  it('when unauthenticated client tries to send message it should be rejected', function(done) {
    newSocket.emit('new message', { foo: 'bar' }, function(err) {
      expect(err).to.be.a('string');
      expect(err).to.equal('Can\'t send a message until you are authenticated');
      done();
    });
  });

  it('when other client joins server should emit "user joined"', function(done) {
    var callbacks = 3;

    var end = function() {
      newSocket.off('user joined');
      socket.off('user joined');
      done();
    };

    newSocket.emit('anonymous user', function(err, results) {
      expect(err).to.equal(null);
      expect(results).to.be.an('object');

      expect(results).to.have.property('username');
      expect(results.username).to.be.a('string');

      expect(results).to.have.property('avatar');
      expect(results.avatar).to.be.a('string');

      --callbacks > 0 || end();
    });

    socket.on('user joined', function(details) {
      expect(details).to.be.an('object');

      expect(details).to.have.property('username');
      expect(details.username).to.be.a('string');

      expect(details).to.have.property('avatar');
      expect(details.avatar).to.be.a('string');

      expect(details).to.have.property('numUsers');
      expect(details.numUsers).to.equal(2);

      --callbacks > 0 || end();
    });

    newSocket.on('user joined', function(details) {
      expect(details).to.be.an('object');

      expect(details).to.have.property('username');
      expect(details.username).to.be.a('string');

      expect(details).to.have.property('avatar');
      expect(details.avatar).to.be.a('string');

      expect(details).to.have.property('numUsers');
      expect(details.numUsers).to.equal(2);

      --callbacks > 0 || end();
    });
  });

  it('when authenticated client tries to send malformed message it should be rejected', function(done) {
    newSocket.emit('new message', { foo: 'bar' }, function(err) {
      expect(err).to.be.a('string');
      expect(err).to.equal('Must pass a parameter `room` which is a string');
      done();
    });
  });

  var sentMessages = [];

  it('when authenticated client sends good message it should be emitted to all', function(done) {
    var callbacks = 2;

    var end = function() {
      socket.off('new message');
      done();
    };

    newSocket.emit(
      'new message',
      {
        room: 'general',
        message: 'hey what up?'
      },
      function(err, message) {
        expect(err).to.equal(null);

        expect(message).to.be.an('object');

        expect(message).to.have.property('room');
        expect(message.room).to.be.a('string');

        expect(message).to.have.property('username');
        expect(message.username).to.be.a('string');

        expect(message).to.have.property('avatar');
        expect(message.avatar).to.be.a('string');

        expect(message).to.have.property('room');
        expect(message.room).to.be.a('string');

        expect(message).to.have.property('time');
        expect(message.time).to.be.a('number');

        expect(message).to.have.property('content');
        expect(message.content).to.be.a('object');

        expect(message.content).to.have.property('text');
        expect(message.content.text).to.be.a('string');

        --callbacks > 0 || end();
      }
    );

    socket.on('new message', function(message) {
      expect(message).to.be.an('object');
      sentMessages.unshift(message);

      expect(message).to.have.property('room');
      expect(message.room).to.be.a('string');

      expect(message).to.have.property('username');
      expect(message.username).to.be.a('string');

      expect(message).to.have.property('avatar');
      expect(message.avatar).to.be.a('string');

      expect(message).to.have.property('room');
      expect(message.room).to.be.a('string');

      expect(message).to.have.property('time');
      expect(message.time).to.be.a('number');

      expect(message).to.have.property('content');
      expect(message.content).to.be.a('object');

      expect(message.content).to.have.property('text');
      expect(message.content.text).to.be.a('string');

      --callbacks > 0 || end();
    });
  });

  it('when other authenticated client sends good message it should be emitted to all', function(done) {
    var callbacks = 2;

    var end = function() {
      socket.off('new message');
      done();
    };

    socket.emit(
      'new message',
      {
        room: 'general',
        message: 'nothing much, how about you?'
      },
      function(err, message) {
        expect(err).to.equal(null);

        expect(message).to.be.an('object');

        expect(message).to.have.property('room');
        expect(message.room).to.be.a('string');

        expect(message).to.have.property('username');
        expect(message.username).to.be.a('string');

        expect(message).to.have.property('avatar');
        expect(message.avatar).to.be.a('string');

        expect(message).to.have.property('room');
        expect(message.room).to.be.a('string');

        expect(message).to.have.property('time');
        expect(message.time).to.be.a('number');

        expect(message).to.have.property('content');
        expect(message.content).to.be.a('object');

        expect(message.content).to.have.property('text');
        expect(message.content.text).to.be.a('string');

        --callbacks > 0 || end();
      }
    );

    newSocket.on('new message', function(message) {
      expect(message).to.be.an('object');
      sentMessages.unshift(message);

      expect(message).to.have.property('room');
      expect(message.room).to.be.a('string');

      expect(message).to.have.property('username');
      expect(message.username).to.be.a('string');

      expect(message).to.have.property('avatar');
      expect(message.avatar).to.be.a('string');

      expect(message).to.have.property('room');
      expect(message.room).to.be.a('string');

      expect(message).to.have.property('time');
      expect(message.time).to.be.a('number');

      expect(message).to.have.property('content');
      expect(message.content).to.be.a('object');

      expect(message.content).to.have.property('text');
      expect(message.content.text).to.be.a('string');

      --callbacks > 0 || end();
    });
  });

  it('fetching the "message list" should return the right messages in the right order', function(done) {
    socket.emit('message list', { room: 'general' }, function(err, results) {
      expect(results.messages).to.be.a('array');

      // Ensure the messages we sent are there, match, and are in the right order.
      expect(results.messages[0]).to.deep.equal(sentMessages[0]);
      expect(results.messages[1]).to.deep.equal(sentMessages[1]);

      done();
    });
  });

  it('when other client disconnects server should emit "user left"', function(done) {
    socket.on('user left', function(details) {
      expect(details).to.be.an('object');

      expect(details).to.have.property('username');
      expect(details.username).to.be.a('string');

      expect(details).to.have.property('avatar');
      expect(details.avatar).to.be.a('string');

      expect(details).to.have.property('numUsers');
      expect(details.numUsers).to.equal(1);

      socket.off('user left');
      done();
    });

    newSocket.disconnect();
  });

  after(function() {
    socket.disconnect();
  });
});
