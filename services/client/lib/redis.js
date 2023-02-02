import { createClient } from 'redis'
import config from './config.js'

export const redis = createClient({
  url: config.REDIS_ENDPOINT
})

redis.on('error', err => console.log('Redis Client Error', err))

await redis.connect()

export default redis
