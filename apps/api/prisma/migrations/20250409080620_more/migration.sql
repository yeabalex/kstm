/*
  Warnings:

  - Added the required column `user_id` to the `subscription_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripe_customer_id` to the `user_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripe_subscription_id` to the `user_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subscription_payments" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "stripe_customer_id" VARCHAR(100) NOT NULL,
ADD COLUMN     "stripe_subscription_id" VARCHAR(100) NOT NULL;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
