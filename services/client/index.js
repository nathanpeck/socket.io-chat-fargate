// Entrypoint
var server = require('./server');
var config = require('./lib/config');

server.listen(config.PORT, function() {
  console.log('Server listening at port %d', config.PORT);
});

process.on('SIGTERM', function() {
  console.log('Received SIGTERM, shutting down server');
  server.close();
  process.exit(0);
});
