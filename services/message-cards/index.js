var config = require('./lib/config');
var Squiss = require('squiss');

var poller = new Squiss({
  queueUrl: config.QUEUE_URL,
  awsConfig: {
    region: config.REGION
  },
  bodyFormat: 'json',
  unwrapSns: true,
  maxInFlight: 50  // Handle a max of 50 messages concurrently.
});

console.log('Message card service up and ready to poll');

poller.start();

poller.on('message', function(msg) {
  console.log(JSON.stringify(msg.body));
  msg.del();
});

process.on('SIGTERM', function() {
  console.log('Received SIGTERM, shutting down message card polling');
  poller.stop();
});
