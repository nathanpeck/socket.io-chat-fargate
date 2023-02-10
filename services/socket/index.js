// Entrypoint
import { server } from './server.js'
import config from './lib/config.js'

server.listen(config.PORT, function () {
  console.log('Server listening at port %d', config.PORT)
})

process.on('SIGTERM', function () {
  console.log('Received SIGTERM, shutting down server')
  server.close()
  process.exit(0)
})
