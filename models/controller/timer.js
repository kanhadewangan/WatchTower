import { fetchData } from "./fetch.js";
import client from "./redis.js";

 export function startMonitoring(websiteId, url, interval = 600) {
  fetchData(websiteId, url); // run once

  setInterval(() => {
    fetchData(websiteId, url).catch(console.error);
  }, interval);
}



// Start monitoring a sample URL every 10 minutes (600,000 ms)
 export async function fetchAllChecks() {
  const BATCH_SIZE = 100;
  const allLogs = [];

  while (true) {
    const batch = await client.lPop("checks:buffer", BATCH_SIZE);

    if (!batch) break;

    // 🔑 normalize to array
    const items = Array.isArray(batch) ? batch : [batch];

    allLogs.push(...items.map(JSON.parse));
  }

  return allLogs;
}


