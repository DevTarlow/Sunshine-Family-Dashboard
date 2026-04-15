-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" INTEGER,
    "noteId" INTEGER,
    "diningOutId" INTEGER,
    "dinnerId" INTEGER,
    CONSTRAINT "Comment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_diningOutId_fkey" FOREIGN KEY ("diningOutId") REFERENCES "DiningOut" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "Dinner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
