/*
  Warnings:

  - A unique constraint covering the columns `[shortCode]` on the table `Memorial` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Memorial" ADD COLUMN "shortCode" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memorialId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plusOne" BOOLEAN NOT NULL DEFAULT false,
    "allergies" TEXT,
    "notes" TEXT,
    "waitlisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("allergies", "createdAt", "email", "id", "memorialId", "name", "notes", "plusOne") SELECT "allergies", "createdAt", "email", "id", "memorialId", "name", "notes", "plusOne" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_memorialId_idx" ON "Attendance"("memorialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Memorial_shortCode_key" ON "Memorial"("shortCode");
