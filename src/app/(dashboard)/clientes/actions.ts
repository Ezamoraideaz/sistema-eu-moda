"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/auth-guards";
import { clienteSchema } from "@/lib/validation/cliente.schema";

export type ClienteFormState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean; clienteId?: string } | undefined;

function readClienteForm(formData: FormData) {
  return {
    tipo: formData.get("tipo"),
    nombre: formData.get("nombre"),
    documento: formData.get("documento"),
    telefono: formData.get("telefono"),
    whatsapp: formData.get("whatsapp"),
    correo: formData.get("correo"),
    direccion: formData.get("direccion"),
    contactoNombre: formData.get("contactoNombre"),
    contactoTelefono: formData.get("contactoTelefono"),
  };
}

export async function createCliente(_prevState: ClienteFormState, formData: FormData): Promise<ClienteFormState> {
  try {
    console.log("🔍 createCliente: iniciando...");

    await requireRole(PERMISSIONS.REGISTRAR_CLIENTE as any);
    console.log("✅ Rol verificado");

    const datos = readClienteForm(formData);
    console.log("📋 Datos del formulario:", datos);

    const parsed = clienteSchema.safeParse(datos);
    if (!parsed.success) {
      console.log("❌ Validación falló:", parsed.error.flatten().fieldErrors);
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    console.log("✅ Datos validados");

    const cliente = await prisma.cliente.create({ data: parsed.data });
    console.log("✅ Cliente creado:", cliente.id);

    revalidatePath("/clientes");

    return { success: true, clienteId: cliente.id };
  } catch (error) {
    console.error("💥 Error en createCliente:", error);
    return { error: error instanceof Error ? error.message : "Error al crear cliente" };
  }
}

export async function updateCliente(_prevState: ClienteFormState, formData: FormData): Promise<ClienteFormState> {
  await requireRole(PERMISSIONS.REGISTRAR_CLIENTE as any);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Cliente inválido." };
  }

  const parsed = clienteSchema.safeParse(readClienteForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.cliente.update({ where: { id }, data: parsed.data });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function searchClientes(query: string) {
  await requireRole(PERMISSIONS.VER_ORDENES);

  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.cliente.findMany({
    where: { nombre: { contains: trimmed } },
    select: { id: true, nombre: true, tipo: true, documento: true, telefono: true },
    take: 10,
    orderBy: { nombre: "asc" },
  });
}
