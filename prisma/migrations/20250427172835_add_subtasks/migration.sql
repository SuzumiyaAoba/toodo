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
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "projectId" TEXT,
    "parentId" TEXT,
    CONSTRAINT "Todo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Todo_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Todo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Todo" ("createdAt", "description", "dueDate", "id", "lastStateChangeAt", "priority", "projectId", "status", "title", "totalWorkTime", "updatedAt", "workState") SELECT "createdAt", "description", "dueDate", "id", "lastStateChangeAt", "priority", "projectId", "status", "title", "totalWorkTime", "updatedAt", "workState" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
