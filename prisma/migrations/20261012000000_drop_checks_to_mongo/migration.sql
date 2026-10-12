/*
  Check history moved to MongoDB. Copy existing rows first with
  `bun run scripts/copy-checks-to-mongo.ts`; this migration drops them.
*/
-- DropTable
DROP TABLE "checks";

-- DropEnum
DROP TYPE "status";

-- DropEnum
DROP TYPE "region";
