-- AlterTable
ALTER TABLE "Memorial" ADD COLUMN "obituaryNote" TEXT;

-- CreateTable
CREATE TABLE "Reception" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memorialId" INTEGER NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "venue" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "welcomeScope" TEXT NOT NULL DEFAULT 'OPEN',
    "wishes" TEXT,
    CONSTRAINT "Reception_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memorialId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "wantsToSpeak" BOOLEAN NOT NULL DEFAULT false,
    "relationsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("count", "createdAt", "email", "id", "memorialId", "name", "notes") SELECT "count", "createdAt", "email", "id", "memorialId", "name", "notes" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_memorialId_idx" ON "Attendance"("memorialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Reception_memorialId_key" ON "Reception"("memorialId");
