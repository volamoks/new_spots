import getRedisClient from '@/lib/redis'; // Import the function

async function main() {
  console.log('Attempting to clear zone cache from Redis...');

  try {
    const redis = getRedisClient(); // Get the client instance
    const keys = await redis.keys('zones:*'); // Find all keys starting with 'zones:'

    if (keys.length > 0) {
      console.log(`Found ${keys.length} zone cache keys to delete.`);
      const deletedCount = await redis.del(keys); // Use the instance
      console.log(`Successfully deleted ${deletedCount} zone cache keys.`);
    } else {
      console.log('No zone cache keys found to delete.');
    }
  } catch (error) {
    console.error('Error clearing Redis zone cache:', error);
    process.exit(1); // Exit with error code
  } finally {
    // No need to explicitly disconnect with ioredis usually,
    // but if your client requires it, add redis.disconnect() or similar here.
    console.log('Redis operation finished.');
  }
}

main();