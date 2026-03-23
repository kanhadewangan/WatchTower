/*
  Warnings:

  - You are about to drop the column `reigon` on the `checks` table. All the data in the column will be lost.
  - Added the required column `region` to the `checks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "region" AS ENUM ('US_EAST_1', 'US_WEST_1', 'EU_CENTRAL_1', 'AP_SOUTHEAST_1');

-- AlterTable
ALTER TABLE "checks" DROP COLUMN "reigon",
ADD COLUMN     "region" "region" NOT NULL;

-- DropEnum
DROP TYPE "reigon";
