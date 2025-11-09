import { PrismaClient } from "@prisma/client";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["error", "warn"], // legg til "query" ved behov i dev
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}