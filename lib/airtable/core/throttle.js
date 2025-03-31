// Track recent request timestamps
let requestTimestamps = [];

// Maximum requests per second (Airtable limit is 5 per second)
const MAX_REQUESTS_PER_SECOND = 4; // Stay under the limit for safety

/**
 * Throttle requests to avoid rate limiting
 * @returns {Promise<void>} Resolves when it's safe to make a request
 */
export async function throttleRequests() {
  // Get current time
  const now = Date.now();
  
  // Clean up old timestamps (older than 1 second)
  requestTimestamps = requestTimestamps.filter(time => now - time < 1000);
  
  // If we haven't hit the limit, allow the request
  if (requestTimestamps.length < MAX_REQUESTS_PER_SECOND) {
    requestTimestamps.push(now);
    return;
  }
  
  // Otherwise, calculate delay needed
  const oldestTimestamp = requestTimestamps[0];
  const delayNeeded = 1000 - (now - oldestTimestamp);
  
  // Add a small buffer to ensure we're safely under the limit
  const delayWithBuffer = delayNeeded + 50;
  
  // Log throttling information
  console.log(`Throttling Airtable request for ${delayWithBuffer}ms to avoid rate limiting`);
  
  // Wait for the delay
  await new Promise(resolve => setTimeout(resolve, delayWithBuffer));
  
  // Add current time to timestamps and remove oldest
  requestTimestamps.shift();
  requestTimestamps.push(Date.now());
}

/**
 * Reset the throttling counters
 * Useful after hitting rate limits to ensure we start fresh
 */
export function resetThrottling() {
  requestTimestamps = [];
  console.log('Throttling timestamps reset');
}

export default {
  throttleRequests,
  resetThrottling
};