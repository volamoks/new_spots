import Redis, { Redis as RedisType } from 'ioredis';

let redisInstance: RedisType | null = null;

function getRedisClient(): RedisType {
  if (!redisInstance) {
    // Ensure the REDIS_URL is defined only when creating the instance
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not defined');
    }

    console.log('Initializing Redis client...');
    // Create a new Redis instance
    // The URL includes authentication and connection details
    redisInstance = new Redis(process.env.REDIS_URL);

    redisInstance.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisInstance.on('connect', () => {
      console.log('Connected to Redis');
    });

    redisInstance.on('close', () => {
      console.log('Redis connection closed.');
      redisInstance = null; // Allow re-initialization if needed
    });
  }
  return redisInstance;
}

// Export the function to get the client instance
export default getRedisClient;