// Using require for compatibility in a setup script
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env.production relative to this script's location
const envPath = path.resolve(__dirname, '../.env.production');
console.log(`[load-env.js] Attempting to load environment variables from: ${envPath}`);
const result = dotenv.config({ path: envPath, override: true }); // Use override to ensure precedence

if (result.error) {
  console.error('[load-env.js] Error loading .env.production:', result.error);
  // Decide if you want to exit if the .env file is critical
  // process.exit(1);
} else {
  console.log('[load-env.js] .env.production loaded successfully.');
  // Optional: Verify if the specific variable is loaded
  // console.log('[load-env.js] REDIS_URL loaded:', process.env.REDIS_URL ? 'Yes' : 'No');
}