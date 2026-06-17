"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { crearServicioClinicaSchema, actualizarServicioClinicaSchema } from "@/lib/validation/clinica.schema";

export async function crearServicioClinicaAction(data: unknown) {
  const session = await requireRole(["ADMIN", "RECEPCION"]);

  const parsed = crearServicioClinicaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const servicio = await prisma.servicioClinica.create({
      data: {
        clienteId: parsed.data.clienteId,
        fechaEntregaEstimada: parsed.data.fechaEntregaEstimada ? new Date(parsed.data.fechaEntregaEstimada) : null,
        items: {
          create: parsed.data.items.map((item) => {
            const valorCotizado = parseFloat(item.valorCotizado);
            const anticipo = parseFloat(item.anticipo || "0");
            const saldoPendiente = valorCotizado - anticipo;
            return {
              prendaTipo: item.prendaTipo,
              prendaDescripcion: item.prendaDescripcion || null,
              trabajoSolicitado: item.trabajoSolicitado,
              valorCotizado,
              anticipo,
              saldoPendiente,
            };
          }),
        },
      },
    });

    return { success: true, servicioId: servicio.id };
  } catch (error) {
    console.error("Error creating servicio:", error);
    return { error: "No se pudo crear el servicio" };
  }
}

export async function actualizarServicioClinicaAction(servicioId: string, data: unknown) {
  const session = await requireRole(["ADMIN", "OPERARIO", "RECEPCION"]);

  const parsed = actualizarServicioClinicaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    const servicio = await prisma.servicioClinica.update({
      where: { id: servicioId },
      data: {
        estado: parsed.data.estado as any,
        fechaEntregaEstimada: parsed.data.fechaEntregaEstimada ? new Date(parsed.data.fechaEntregaEstimada) : undefined,
      },
    });

    return { success: true, servicioId: servicio.id };
  } catch (error) {
    console.error("Error updating servicio:", error);
    return { error: "No se pudo actualizar el servicio" };
  }
}

export async function agregarItemServicioAction(servicioId: string, data: unknown) {
  const session = await requireRole(["ADMIN", "RECEPCION"]);

  try {
    const item = {
      prendaTipo: (data as any).prendaTipo,
      prendaDescripcion: (data as any).prendaDescripcion || null,
      trabajoSolicitado: (data as any).trabajoSolicitado,
      valorCotizado: parseFloat((data as any).valorCotizado),
      anticipo: parseFloat((data as any).anticipo || "0"),
    };

    item.valorCotizado - item.anticipo; // calcular saldo

    const newItem = await prisma.itemServicioClinica.create({
      data: {
        servicioId,
        ...item,
        saldoPendiente: item.valorCotizado - item.anticipo,
      },
    });

    return { success: true, itemId: newItem.id };
  } catch (error) {
    console.error("Error adding item:", error);
    return { error: "No se pudo agregar el item" };
  }
}

export async function eliminarItemServicioAction(itemId: string) {
  const session = await requireRole(["ADMIN", "RECEPCION"]);

  try {
    await prisma.itemServicioClinica.delete({
      where: { id: itemId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting item:", error);
    return { error: "No se pudo eliminar el item" };
  }
}

export async function agregarFotoServicioAction(
  servicioId: string,
  url: string,
  tipo: "ANTES" | "DESPUES"
) {
  const session = await requireRole(["ADMIN", "OPERARIO", "RECEPCION"]);

  try {
    const foto = await prisma.fotoServicio.create({
      data: {
        servicioId,
        url,
        tipo,
      },
    });

    return { success: true, fotoId: foto.id };
  } catch (error) {
    console.error("Error adding foto:", error);
    return { error: "No se pudo agregar la foto" };
  }
}

export async function eliminarFotoServicioAction(fotoId: string) {
  const session = await requireRole(["ADMIN", "OPERARIO"]);

  try {
    await prisma.fotoServicio.delete({
      where: { id: fotoId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting foto:", error);
    return { error: "No se pudo eliminar la foto" };
  }
}
