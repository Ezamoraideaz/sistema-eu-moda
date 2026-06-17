import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { createMariaDbAdapter } from "@/lib/db-adapter";

// HostGator shared hosting caps total concurrent MySQL connections low.
// Keep each serverless instance's pool tiny so a handful of warm Vercel
// functions can't exhaust the database's connection budget on their own.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: createMariaDbAdapter(3) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
