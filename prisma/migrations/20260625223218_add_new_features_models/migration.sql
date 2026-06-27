-- AlterTable
ALTER TABLE "MealPrepItem" ADD COLUMN "consumptionTime" TEXT;

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "lastReminderSentAt" DATETIME;
ALTER TABLE "Todo" ADD COLUMN "reminderInterval" INTEGER;

-- CreateTable
CREATE TABLE "GroceryCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "eventDate" DATETIME NOT NULL,
    "eventTime" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    CONSTRAINT "CalendarEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'Uncategorized',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "memberId" INTEGER,
    CONSTRAINT "RecipeLink_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mealDate" DATETIME NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "mealTime" TEXT NOT NULL,
    "mealName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "recipeLinkId" INTEGER,
    "memberId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlannedMeal_recipeLinkId_fkey" FOREIGN KEY ("recipeLinkId") REFERENCES "RecipeLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlannedMeal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArchivedMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalId" INTEGER,
    "mealDate" DATETIME NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "mealTime" TEXT NOT NULL,
    "mealName" TEXT NOT NULL,
    "recipeLink" TEXT,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ArchivedNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalId" INTEGER,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    "memberName" TEXT,
    "memberEmoji" TEXT,
    "memberColor" TEXT
);

-- CreateTable
CREATE TABLE "DeletedTodo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalId" INTEGER,
    "task" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    "memberName" TEXT,
    "memberEmoji" TEXT,
    "memberColor" TEXT
);

-- CreateTable
CREATE TABLE "DeletedMealPrepItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalId" INTEGER,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "consumptionTime" TEXT,
    "createdAt" DATETIME NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    "memberName" TEXT,
    "memberEmoji" TEXT,
    "memberColor" TEXT
);

-- CreateTable
CREATE TABLE "FamilySetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    "noteId" INTEGER,
    "diningOutId" INTEGER,
    "dinnerId" INTEGER,
    "recipeLinkId" INTEGER,
    "plannedMealId" INTEGER,
    CONSTRAINT "Comment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_diningOutId_fkey" FOREIGN KEY ("diningOutId") REFERENCES "DiningOut" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_recipeLinkId_fkey" FOREIGN KEY ("recipeLinkId") REFERENCES "RecipeLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_plannedMealId_fkey" FOREIGN KEY ("plannedMealId") REFERENCES "PlannedMeal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("content", "createdAt", "diningOutId", "dinnerId", "id", "memberId", "noteId") SELECT "content", "createdAt", "diningOutId", "dinnerId", "id", "memberId", "noteId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_noteId_idx" ON "Comment"("noteId");
CREATE INDEX "Comment_diningOutId_idx" ON "Comment"("diningOutId");
CREATE INDEX "Comment_dinnerId_idx" ON "Comment"("dinnerId");
CREATE INDEX "Comment_recipeLinkId_idx" ON "Comment"("recipeLinkId");
CREATE INDEX "Comment_plannedMealId_idx" ON "Comment"("plannedMealId");
CREATE TABLE "new_Grocery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "item" TEXT NOT NULL,
    "isBought" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    CONSTRAINT "Grocery_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Grocery" ("createdAt", "id", "isBought", "item", "memberId") SELECT "createdAt", "id", "isBought", "item", "memberId" FROM "Grocery";
DROP TABLE "Grocery";
ALTER TABLE "new_Grocery" RENAME TO "Grocery";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Member" ("backgroundImage", "camUrl", "color", "createdAt", "emoji", "id", "llmModel", "llmServerUrl", "name", "notificationsEnabled", "theme") SELECT "backgroundImage", "camUrl", "color", "createdAt", "emoji", "id", "llmModel", "llmServerUrl", "name", "notificationsEnabled", "theme" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GroceryCategory_name_key" ON "GroceryCategory"("name");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventDate_idx" ON "CalendarEvent"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeLink_url_key" ON "RecipeLink"("url");

-- CreateIndex
CREATE INDEX "RecipeLink_rating_idx" ON "RecipeLink"("rating");

-- CreateIndex
CREATE INDEX "RecipeLink_category_idx" ON "RecipeLink"("category");

-- CreateIndex
CREATE INDEX "PlannedMeal_mealDate_mealTime_sortOrder_idx" ON "PlannedMeal"("mealDate", "mealTime", "sortOrder");

-- CreateIndex
CREATE INDEX "ArchivedMeal_mealDate_idx" ON "ArchivedMeal"("mealDate");

-- CreateIndex
CREATE INDEX "ArchivedNote_archivedAt_idx" ON "ArchivedNote"("archivedAt");

-- CreateIndex
CREATE INDEX "DeletedTodo_deletedAt_idx" ON "DeletedTodo"("deletedAt");

-- CreateIndex
CREATE INDEX "DeletedMealPrepItem_deletedAt_idx" ON "DeletedMealPrepItem"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySetting_key_key" ON "FamilySetting"("key");

-- CreateIndex
CREATE INDEX "DiningOut_date_idx" ON "DiningOut"("date");

-- CreateIndex
CREATE INDEX "MealPrepItem_createdAt_idx" ON "MealPrepItem"("createdAt");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "SharedLink_createdAt_idx" ON "SharedLink"("createdAt");
