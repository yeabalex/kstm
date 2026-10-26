/*
  Warnings:

  - The `csv` column on the `Kb` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `pdf` column on the `Kb` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `web_url` column on the `Kb` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `json` column on the `Kb` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `txt` column on the `Kb` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Kb" DROP COLUMN "csv",
ADD COLUMN     "csv" TEXT[],
DROP COLUMN "pdf",
ADD COLUMN     "pdf" TEXT[],
DROP COLUMN "web_url",
ADD COLUMN     "web_url" TEXT[],
DROP COLUMN "json",
ADD COLUMN     "json" TEXT[],
DROP COLUMN "txt",
ADD COLUMN     "txt" TEXT[];
