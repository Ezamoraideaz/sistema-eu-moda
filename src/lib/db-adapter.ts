import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Sin "server-only": lo usan tanto el singleton de la app (lib/db.ts) como
// prisma/seed.ts, que corre con `node` plano fuera del bundler de Next.js.
export function createMariaDbAdapter(connectionLimit: number) {
  const url = new URL(process.env.DATABASE_URL!);
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit,
    acquireTimeout: 20000,
    connectTimeout: 10000,
  });
}
