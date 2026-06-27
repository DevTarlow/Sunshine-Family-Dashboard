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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Member" ("backgroundImage", "color", "createdAt", "emoji", "id", "name", "theme") SELECT "backgroundImage", "color", "createdAt", "emoji", "id", "name", "theme" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
