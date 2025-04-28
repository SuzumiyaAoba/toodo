-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Todo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "workState" TEXT NOT NULL DEFAULT 'idle',
    "totalWorkTime" INTEGER NOT NULL DEFAULT 0,
    "lastStateChangeAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium'
);
INSERT INTO "new_Todo" ("createdAt", "description", "id", "lastStateChangeAt", "status", "title", "totalWorkTime", "updatedAt", "workState") SELECT "createdAt", "description", "id", "lastStateChangeAt", "status", "title", "totalWorkTime", "updatedAt", "workState" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
