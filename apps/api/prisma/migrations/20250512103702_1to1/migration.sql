/*
  Warnings:

  - You are about to drop the `_KbBots` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[botId]` on the table `Kb` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `botId` to the `Kb` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_KbBots" DROP CONSTRAINT "_KbBots_A_fkey";

-- DropForeignKey
ALTER TABLE "_KbBots" DROP CONSTRAINT "_KbBots_B_fkey";

-- AlterTable
ALTER TABLE "Bot" ADD COLUMN     "private" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Kb" ADD COLUMN     "botId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_KbBots";

-- CreateIndex
CREATE UNIQUE INDEX "Kb_botId_key" ON "Kb"("botId");

-- AddForeignKey
ALTER TABLE "Kb" ADD CONSTRAINT "Kb_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
