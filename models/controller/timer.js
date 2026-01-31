import { fetchData } from "./fetch.js";
import client from "./redis.js";

 export function startMonitoring(url, interval) {
  // Run immediately once
  fetchData(url).then(console.log).catch(console.error);

  // Then repeat
  setInterval(() => {
    fetchData(url).catch(console.error);
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

fetchAllChecks().then((logs) => {
  console.log("All fetched logs:", logs);
}).catch((err) => {
  console.error("Error fetching all logs:", err);
});
