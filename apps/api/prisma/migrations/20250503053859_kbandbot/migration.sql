-- CreateTable
CREATE TABLE "Kb" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "csv" TEXT,
    "pdf" TEXT,
    "web_url" TEXT,
    "json" TEXT,
    "txt" TEXT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" SERIAL NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "profile_image" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "prompt_template" TEXT,
    "theme" TEXT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KbBots" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_KbBots_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_KbBots_B_index" ON "_KbBots"("B");

-- AddForeignKey
ALTER TABLE "Kb" ADD CONSTRAINT "Kb_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KbBots" ADD CONSTRAINT "_KbBots_A_fkey" FOREIGN KEY ("A") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KbBots" ADD CONSTRAINT "_KbBots_B_fkey" FOREIGN KEY ("B") REFERENCES "Kb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
