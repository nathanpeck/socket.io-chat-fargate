var socketClient = require('socket.io-client');
var faker = require('faker');
var async = require('async');
var config = {
  APP_URL: process.env.APP_URL
};

var MAX_DURATION = parseInt(process.env.DURATION_MINS, 10) * 60 * 1000 || 30 * 60 * 1000;
var MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT, 10) || 80;
var MIN_CONCURRENT = parseInt(process.env.MIN_CONCURRENT, 10) || 0;

console.log(`Running for ${MAX_DURATION} starting from ` +
            `${MIN_CONCURRENT} concurrent agents, and ramping up to ${MAX_CONCURRENT} ` +
            'concurrent agents');

var Agent = function(id) {
  this.id = id;
  this.authenticated = false;
};

Agent.prototype.typing = function(done) {
  console.log(`Agent ${this.id} typing`);
  this.socket.emit('typing', 'general');
  done();
};

Agent.prototype.stopTyping = function(done) {
  console.log(`Agent ${this.id} stop typing`);
  this.socket.emit('stop typing', 'general');
  done();
};

Agent.prototype.sendMessage = function(done) {
  console.log(`Agent ${this.id} new message`);
  this.socket.emit('new message', {
    room: 'general',
    message: faker.lorem.sentence()
  }, done);
};

Agent.prototype.createAccount = function(done) {
  this.socket.emit('create user', {
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password()
  }, done);
};

Agent.prototype.authAnonymous = function(done) {
  console.log(`Agent ${this.id} anonymous user`);
  this.socket.emit('anonymous user', done);
};

Agent.prototype.connect = function(done) {
  console.log(`Agent ${this.id} connect`);
  this.socket = socketClient(config.APP_URL, {
    transports: ['websocket'],
    secure: true,
    reconnect: true,
    rejectUnauthorized: false
  });
  this.socket.once('connect', done);
  this.socket.on('connect', function() {
    console.log(`Agent ${this.id} connect done`);
  });
};

Agent.prototype.disconnect = function(done) {
  console.log(`Agent ${this.id} disconnect`);
  this.socket.disconnect();
  done();
};

Agent.prototype.pause = function(duration) {
  return function(done) {
    setTimeout(done, duration);
  };
};

Agent.prototype.spamMessage = function(number, done) {
  console.log(`Agent ${this.id} sending a message`);
  async.series([
    this.pause(1000).bind(this),
    this.typing.bind(this),
    this.pause(1000).bind(this),
    this.sendMessage.bind(this),
    this.stopTyping.bind(this)
  ], done);
};

Agent.prototype.spamMessages = function(howMany) {
  var self = this;
  return function(doneSpamming) {
    console.log(`Agent ${this.id} spamming messages`);
    async.timesSeries(howMany, self.spamMessage.bind(self), doneSpamming);
  };
};

// Initiate an agent.
Agent.prototype.start = function(done) {
  async.series([
    this.connect.bind(this),
    this.pause(1000).bind(this),
    this.authAnonymous.bind(this),
    this.pause(1000).bind(this),
    this.spamMessages(faker.random.number({ min: 5, max: 20 })).bind(this),
    this.pause(1000).bind(this),
    this.disconnect.bind(this)
  ], done);
};

var concurrent = 0;
var start = Date.now();
var agentId = 0;

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
  return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

function maybeLaunchAgent() {
  var now = Date.now();
  var duration = now - start;

  if (duration > MAX_DURATION) {
    process.exit(0);
  }

  var targetConcurrent = scaleBetween(duration, MAX_CONCURRENT, MIN_CONCURRENT, MAX_DURATION, 0);

  if (concurrent < targetConcurrent) {
    concurrent++;

    var agent = new Agent(agentId);
    agentId++;
    agent.start(function() {
      concurrent--;
    });

    setImmediate(maybeLaunchAgent);
  } else {
    setTimeout(maybeLaunchAgent, 1000);
  }
}

maybeLaunchAgent();
