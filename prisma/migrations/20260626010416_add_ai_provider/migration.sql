-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '😊',
    "color" TEXT NOT NULL DEFAULT 'blue',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "accentColor" TEXT NOT NULL DEFAULT 'blue',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "backgroundImage" TEXT,
    "panelVisibility" TEXT,
    "camUrl" TEXT,
    "llmServerUrl" TEXT,
    "llmModel" TEXT,
    "aiProvider" TEXT NOT NULL DEFAULT 'local',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Member" ("accentColor", "backgroundImage", "camUrl", "color", "createdAt", "emoji", "id", "llmModel", "llmServerUrl", "name", "notificationsEnabled", "panelVisibility", "theme") SELECT "accentColor", "backgroundImage", "camUrl", "color", "createdAt", "emoji", "id", "llmModel", "llmServerUrl", "name", "notificationsEnabled", "panelVisibility", "theme" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
