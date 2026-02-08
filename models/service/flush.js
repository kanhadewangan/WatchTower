import { fetchAllChecks } from "./timer.js";
import {prisma} from "../../prisma/prisma.js";

export async function flushLogsToDB() {
  const logs = await fetchAllChecks();
  if (logs.length === 0) return;

  // Get userId from website
  const logsWithUserId = await Promise.all(
    logs.map(async (log) => {
      const website = await prisma.website.findUnique({
        where: { id: log.websiteId },
        select: { userId: true }
      });
      
      return {
        website_id: log.websiteId,
        status_code: log.statusCode,
        response_time: log.responseTime,
        status: log.status,
        userId: website?.userId || null,
        reigon: log.reigon || "US_EAST_1",
        created_at: new Date(log.checkedAt),
      };
    })
    
  );
  const metrics = logsWithUserId.map(logs =>({
    status: logs.status,
    response_time: logs.response_time,
    website_id: logs.website_id
  }))
   const upCount = metrics.filter(m => m.status === "UP").length;
   const totalCount = metrics.length;
   const uptimePercentage = totalCount === 0 ? 0 : (upCount / totalCount) * 100;
   if (uptimePercentage < 90) {
    
   }
  console.log(`🧹 Flushing ${logsWithUserId.length} checks to database`);

  if (logsWithUserId.length > 0) {
    await prisma.checks.createMany({
      data: logsWithUserId.filter(log => log.userId !== null),
      
      skipDuplicates: true,
    });
    console.log(`✅ Flushed ${logsWithUserId.length} checks to database`);
  }

}

export function startFlushInterval() {
  console.log("🧹 Flush worker started");
  setInterval(async () => {
    try {
        await flushLogsToDB();
      console.log("🧹 Flush cycle completed");
    } catch (error) {
      console.error("Error flushing logs:", error);
    } 
  }, 60000); // every 1 minute
}
