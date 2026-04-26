-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '😊',
    "color" TEXT NOT NULL DEFAULT 'blue',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "backgroundImage" TEXT,
    "camUrl" TEXT,
    "llmServerUrl" TEXT,
    "llmModel" TEXT,
    "vibeMessage" TEXT,
    "vibeGeneratedAt" DATETIME,
    "weatherApiKey" TEXT,
    "weatherCity" TEXT,
    "weatherUnits" TEXT,
    "autoRefreshInterval" INTEGER NOT NULL DEFAULT 30000,
    "vibeRefreshInterval" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Member" ("backgroundImage", "camUrl", "color", "createdAt", "emoji", "id", "llmModel", "llmServerUrl", "name", "notificationsEnabled", "theme", "vibeGeneratedAt", "vibeMessage", "weatherApiKey", "weatherCity", "weatherUnits") SELECT "backgroundImage", "camUrl", "color", "createdAt", "emoji", "id", "llmModel", "llmServerUrl", "name", "notificationsEnabled", "theme", "vibeGeneratedAt", "vibeMessage", "weatherApiKey", "weatherCity", "weatherUnits" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
