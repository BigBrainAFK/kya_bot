/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `topics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "topics_id_key" ON "topics"("id");
