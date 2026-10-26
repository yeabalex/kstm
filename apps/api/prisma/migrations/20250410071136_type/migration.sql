/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `SubscriptionPayment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "SubscriptionPayment" DROP CONSTRAINT "SubscriptionPayment_subscriptionId_fkey";

-- DropIndex
DROP INDEX "UserSubscription_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "SubscriptionPayment" DROP COLUMN "subscriptionId";

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");
