 import { fetchAllChecks } from "../controller/timer.js";
 import prisma from "../../prisma/prisma.js";
 export async function flushLogsToDB()
  {
  const logs = await fetchAllChecks();
  if (logs.length === 0) return;

 await prisma.checks.createMany({
  data: logs.map(log => ({
    website_id: log.websiteId, // now valid FK ✅
    status_code: log.statusCode,
    response_time: log.responseTime,
    status: log.status,
    userId:'cml1wfddt0000kefgvgr150x6',
    reigon:'US_EAST_1',
    created_at: new Date(log.checkedAt),

  })),
});
  }
