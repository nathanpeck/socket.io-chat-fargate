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

  after(function() {
    socket.disconnect();
  });
});
