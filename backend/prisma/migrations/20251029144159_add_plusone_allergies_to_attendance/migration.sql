/*
  Warnings:

  - You are about to drop the column `count` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `relationsJson` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `wantsToSpeak` on the `Attendance` table. All the data in the column will be lost.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("createdAt", "email", "id", "memorialId", "name", "notes") SELECT "createdAt", "email", "id", "memorialId", "name", "notes" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_memorialId_idx" ON "Attendance"("memorialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
