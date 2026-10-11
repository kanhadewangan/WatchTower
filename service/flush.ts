import { fetchAllChecks } from "./timer";
import prisma from '../prisma/prisma';
import client from "./redis.js";

const CHUNK_SIZE = 1000;

// Drain the whole Redis buffer in chunks so throughput is not capped per cycle.
export async function flushLogsToDB() {
  let flushed = 0;

  while (true) {
    const logs = await fetchAllChecks(CHUNK_SIZE);
    if (logs.length === 0) break;

    try {
      // One query for all distinct websites instead of one per log
      const websiteIds = [...new Set(logs.map((log) => log.websiteId as string))];
      const websites = await prisma.website.findMany({
        where: { id: { in: websiteIds } },
        select: { id: true, userId: true },
      });
      const userByWebsite = new Map(websites.map((w) => [w.id, w.userId]));

      // Checks for websites that no longer exist are dropped
      const rows = logs
        .filter((log) => userByWebsite.has(log.websiteId))
        .map((log) => ({
          website_id: log.websiteId,
          status_code: log.statusCode,
          response_time: log.responseTime,
          status: log.status,
          userId: userByWebsite.get(log.websiteId)!,
          region: log.region || "US_EAST_1",
          created_at: new Date(log.checkedAt),
        }));

      if (rows.length > 0) {
        await prisma.checks.createMany({ data: rows, skipDuplicates: true });
      }
      flushed += rows.length;
    } catch (error) {
      // Put the popped checks back so a failed write doesn't lose them
      await client.rPush("checks:buffer", logs.map((log) => JSON.stringify(log)));
      throw error;
    }

    if (logs.length < CHUNK_SIZE) break;
  }

  if (flushed > 0) console.log(`✅ Flushed ${flushed} checks to database`);
}

let flushing = false;

export function startFlushInterval() {
  console.log("🧹 Flush worker started");
  setInterval(async () => {
    if (flushing) return; // don't overlap with a previous run
    flushing = true;
    try {
      await flushLogsToDB();
    } catch (error) {
      console.error("Error flushing logs:", error);
    } finally {
      flushing = false;
    }
  }, 600000); // every 10 minutes
}
