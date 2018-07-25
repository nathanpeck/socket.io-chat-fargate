// Initialize the Datadog APM tracer.
const tracer = require('dd-trace');
tracer.init();

var config = require('./lib/config');
config.tracer = tracer;

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
  const span = tracer.startSpan('message');
  span.setTag('service.name', 'message-cards');
  span.setTag('resource.name', 'message');
  tracer.scopeManager().activate(span);

  console.log(JSON.stringify(msg));

  msg.del();
  span.finish();
});

process.on('SIGTERM', function() {
  console.log('Received SIGTERM, shutting down message card polling');
  poller.stop();
});
