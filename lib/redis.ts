import Redis from 'ioredis';

// Ensure the REDIS_URL is defined
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not defined');
}

// Create a new Redis instance
// The URL includes authentication and connection details
const redis = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

export default redis;