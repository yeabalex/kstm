import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
});

redis.on('error', (err) => {
  // Gracefully handle redis connection issues without crashing the app
  console.warn(`Redis connection warning: ${err.message}`);
});

export default redis;
