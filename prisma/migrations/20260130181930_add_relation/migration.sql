/*
  Warnings:

  - Added the required column `userId` to the `checks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "checks" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
