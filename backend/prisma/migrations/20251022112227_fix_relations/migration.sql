-- CreateTable
CREATE TABLE "Memorial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME,
    "deathDate" DATETIME,
    "bio" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ceremony" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memorialId" INTEGER NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "venue" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "livestream" TEXT,
    CONSTRAINT "Ceremony_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memorialId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemoryNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memorialId" INTEGER NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryNote_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Memorial_slug_key" ON "Memorial"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ceremony_memorialId_key" ON "Ceremony"("memorialId");

-- CreateIndex
CREATE INDEX "Attendance_memorialId_idx" ON "Attendance"("memorialId");

-- CreateIndex
CREATE INDEX "MemoryNote_memorialId_approved_idx" ON "MemoryNote"("memorialId", "approved");
