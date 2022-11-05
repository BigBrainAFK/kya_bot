/*
  Warnings:

  - The primary key for the `topics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `guildId` on table `topics` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "topics" DROP CONSTRAINT "topics_pkey",
ALTER COLUMN "guildId" SET NOT NULL,
ADD CONSTRAINT "topics_pkey" PRIMARY KEY ("guildId", "value");
