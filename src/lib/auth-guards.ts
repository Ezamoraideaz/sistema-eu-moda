import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/prisma-client/client";

export const getSession = cache(async () => auth());

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("No autenticado");
  }
  return session;
}

export async function requireRole(roles: readonly Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

// Fuente de verdad para qué rol puede hacer qué (ver Sección 4 del plan).
export const PERMISSIONS = {
  VER_DASHBOARD: ["ADMIN", "OPERARIO", "RECEPCION"],
  VER_ORDENES: ["ADMIN", "OPERARIO", "RECEPCION"],
  ACTUALIZAR_ESTADO_ORDEN: ["ADMIN", "OPERARIO"],
  REGISTRAR_CLIENTE: ["ADMIN", "RECEPCION"],
  CREAR_ORDEN: ["ADMIN", "RECEPCION"],
  ENTREGAR_PRENDA: ["ADMIN", "RECEPCION"],
  GESTIONAR_INVENTARIO: ["ADMIN", "OPERARIO"],
  GESTIONAR_GASTOS: ["ADMIN"],
  VER_REPORTES_FINANCIEROS: ["ADMIN"],
  GESTIONAR_USUARIOS: ["ADMIN"],
} as const satisfies Record<string, Role[]>;
