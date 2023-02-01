import { createClient } from 'redis'
import * as config from './config.js'

export const redis = createClient({
  host: config.REDIS_ENDPOINT
});

redis.on('error', err => console.log('Redis Client Error', err));

await redis.connect();