// One-off: copies existing Postgres `checks` rows into MongoDB and rebuilds the per-website
// counters. Run it BEFORE applying the migration that drops the `checks` table:
//   bun run scripts/copy-checks-to-mongo.ts
// Safe to re-run: it clears the Mongo checks and counters first, then reloads them.
import "../api/env.ts";
import mongoose from "mongoose";
import prisma from "../prisma/prisma.ts";
import { connection, CheckModel, StatsModel } from "../checker/mongodb/schema.ts";

const BATCH = 5000;

type Row = {
  website_id: string; userId: string; status_code: number; response_time: number;
  status: "UP" | "DOWN"; region: string; created_at: Date;
};

await mongoose.connect(connection);
await Promise.all([CheckModel.deleteMany({}), StatsModel.deleteMany({})]);

let copied = 0;
for (let offset = 0; ; offset += BATCH) {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT website_id, "userId", status_code, response_time, status::text AS status,
           region::text AS region, created_at
    FROM checks ORDER BY created_at, id LIMIT ${BATCH} OFFSET ${offset}`;
  if (rows.length === 0) break;

  await CheckModel.insertMany(rows.map((r) => ({
    websiteId: r.website_id, userId: r.userId, statusCode: r.status_code,
    responseTime: r.response_time, status: r.status, region: r.region, createdAt: r.created_at,
  })));
  copied += rows.length;
  console.log(`copied ${copied}`);
}

// Rebuild counters from the copied checks
await CheckModel.aggregate([
  { $group: {
    _id: "$websiteId",
    userId: { $first: "$userId" },
    totalChecks: { $sum: 1 },
    upChecks: { $sum: { $cond: [{ $eq: ["$status", "UP"] }, 1, 0] } },
    downChecks: { $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] } },
    totalResponseTime: { $sum: "$responseTime" },
  } },
  { $project: { _id: 0, websiteId: "$_id", userId: 1, totalChecks: 1, upChecks: 1, downChecks: 1, totalResponseTime: 1 } },
  { $merge: { into: StatsModel.collection.name } },
]);

console.log(`done: ${copied} checks, ${await StatsModel.countDocuments()} websites`);
await mongoose.disconnect();
await prisma.$disconnect();
