/*
  Warnings:

  - You are about to drop the column `free_chat_credit` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `free_url_credit` on the `user_subscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `user_subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "free_chat_credit",
DROP COLUMN "free_url_credit";

-- CreateTable
CREATE TABLE "free_tiers" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "free_chat_credit" INTEGER NOT NULL DEFAULT 15,
    "free_url_credit" SMALLINT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "free_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "free_tiers_user_id_key" ON "free_tiers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_key" ON "user_subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "free_tiers" ADD CONSTRAINT "free_tiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
