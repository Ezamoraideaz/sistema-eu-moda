"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { PERMISSIONS } from "@/lib/auth-guards";
import { clienteSchema } from "@/lib/validation/cliente.schema";

export type ClienteFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

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
  await requireRole(PERMISSIONS.REGISTRAR_CLIENTE as any);

  const parsed = clienteSchema.safeParse(readClienteForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const cliente = await prisma.cliente.create({ data: parsed.data });
  revalidatePath("/clientes");
  redirect(`/clientes/${cliente.id}`);
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
