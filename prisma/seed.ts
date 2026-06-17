import { PrismaClient } from "../src/generated/prisma/client";
import { createMariaDbAdapter } from "../src/lib/db-adapter";
import { hash } from "bcryptjs";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const nombre = process.env.SEED_ADMIN_NOMBRE ?? "Administrador";

  if (!email || !password) {
    throw new Error("Definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD antes de ejecutar el seed.");
  }

  const prisma = new PrismaClient({ adapter: createMariaDbAdapter(1) });
  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, nombre, role: "ADMIN", activo: true },
    create: { email, passwordHash, nombre, role: "ADMIN" },
  });

  console.log(`Usuario ADMIN listo: ${admin.email}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
