// Entrypoint

// Initialize the Datadog APM tracer.
const tracer = require('dd-trace');
tracer.init();

var config = require('./lib/config');
config.tracer = tracer;

var server = require('./server');

server.listen(config.PORT, function() {
  console.log('Server listening at port %d', config.PORT);
});

process.on('SIGTERM', function() {
  console.log('Received SIGTERM, shutting down server');
  server.close();
  process.exit(0);
});
