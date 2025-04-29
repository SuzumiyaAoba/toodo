-- CreateTable
CREATE TABLE "WorkPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TodoActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "todoId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousState" TEXT,
    "workTime" INTEGER,
    "workPeriodId" TEXT,
    CONSTRAINT "TodoActivity_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TodoActivity_workPeriodId_fkey" FOREIGN KEY ("workPeriodId") REFERENCES "WorkPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TodoActivity" ("createdAt", "id", "note", "previousState", "todoId", "type", "workTime") SELECT "createdAt", "id", "note", "previousState", "todoId", "type", "workTime" FROM "TodoActivity";
DROP TABLE "TodoActivity";
ALTER TABLE "new_TodoActivity" RENAME TO "TodoActivity";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
