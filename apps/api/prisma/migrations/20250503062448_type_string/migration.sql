/*
  Warnings:

  - The primary key for the `Bot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Kb` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_KbBots` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_KbBots" DROP CONSTRAINT "_KbBots_A_fkey";

-- DropForeignKey
ALTER TABLE "_KbBots" DROP CONSTRAINT "_KbBots_B_fkey";

-- AlterTable
ALTER TABLE "Bot" DROP CONSTRAINT "Bot_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "Bot_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Bot_id_seq";

-- AlterTable
ALTER TABLE "Kb" DROP CONSTRAINT "Kb_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "Kb_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Kb_id_seq";

-- AlterTable
ALTER TABLE "_KbBots" DROP CONSTRAINT "_KbBots_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "B" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "_KbBots_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "_KbBots" ADD CONSTRAINT "_KbBots_A_fkey" FOREIGN KEY ("A") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KbBots" ADD CONSTRAINT "_KbBots_B_fkey" FOREIGN KEY ("B") REFERENCES "Kb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
