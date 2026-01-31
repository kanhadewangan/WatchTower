 import { fetchAllChecks } from "../controller/timer.js";
 import prisma from "../../prisma/prisma.js";
 export async function flushLogsToDB()
  {
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
        reigon: 'US_EAST_1',
        created_at: new Date(log.checkedAt),
      };
    })
  );

 await prisma.checks.createMany({
  data: logsWithUserId.filter(log => log.userId !== null),
  skipDuplicates: true,
});
  }
