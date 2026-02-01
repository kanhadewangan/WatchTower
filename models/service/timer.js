import { fetchData } from "./fetch.js";
import client from "./redis.js";

 export function startMonitoring(websiteId, url, reigon, interval) {
  fetchData(websiteId, url, reigon); // run once

  setInterval(() => {
    fetchData(websiteId, url, reigon).catch(console.error);
  }, interval * 1000); // convert seconds to milliseconds
}



// Fetch all checks from Redis buffer
export async function fetchAllChecks() {
  const BATCH_SIZE = 100;
  const allLogs = [];

  while (true) {
    // lPop returns a single item, loop to get multiple
    const item = await client.lPop("checks:buffer");

    if (!item) break;

    allLogs.push(JSON.parse(item));
    
    // Stop if we've fetched enough items
    if (allLogs.length >= BATCH_SIZE) break;
  }

  return allLogs;
}
