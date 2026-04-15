-- AlterTable
ALTER TABLE "Member" ADD COLUMN "backgroundImage" TEXT;

-- CreateTable
CREATE TABLE "PhotoFavorite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memberId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    CONSTRAINT "PhotoFavorite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoFavorite_memberId_filename_key" ON "PhotoFavorite"("memberId", "filename");
