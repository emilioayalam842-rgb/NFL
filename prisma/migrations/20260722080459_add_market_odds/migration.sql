-- AlterTable
ALTER TABLE "Game" ADD COLUMN "moneylineAwayOdds" INTEGER;
ALTER TABLE "Game" ADD COLUMN "moneylineHomeOdds" INTEGER;
ALTER TABLE "Game" ADD COLUMN "oddsSource" TEXT;
ALTER TABLE "Game" ADD COLUMN "oddsUpdatedAt" DATETIME;
ALTER TABLE "Game" ADD COLUMN "spreadAwayOdds" INTEGER;
ALTER TABLE "Game" ADD COLUMN "spreadHomeOdds" INTEGER;
ALTER TABLE "Game" ADD COLUMN "totalOverOdds" INTEGER;
ALTER TABLE "Game" ADD COLUMN "totalUnderOdds" INTEGER;

-- CreateTable
CREATE TABLE "PlayerPropLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "statLabel" TEXT NOT NULL,
    "line" REAL NOT NULL,
    "overOdds" INTEGER,
    "underOdds" INTEGER,
    "oddsSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayerPropLine_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
