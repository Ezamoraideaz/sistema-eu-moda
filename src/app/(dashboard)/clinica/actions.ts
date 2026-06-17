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
    const valorCotizado = parseFloat(parsed.data.valorCotizado);
    const anticipo = parseFloat(parsed.data.anticipo || "0");
    const saldoPendiente = valorCotizado - anticipo;

    const servicio = await prisma.servicioClinica.create({
      data: {
        clienteId: parsed.data.clienteId,
        prendaTipo: parsed.data.prendaTipo,
        prendaDescripcion: parsed.data.prendaDescripcion || null,
        trabajoSolicitado: parsed.data.trabajoSolicitado,
        valorCotizado: valorCotizado,
        anticipo: anticipo,
        saldoPendiente: saldoPendiente,
        fechaEntregaEstimada: parsed.data.fechaEntregaEstimada ? new Date(parsed.data.fechaEntregaEstimada) : null,
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
    // Si solo estamos cambiando estado, obtenemos los valores actuales
    const existente = await prisma.servicioClinica.findUnique({
      where: { id: servicioId },
    });

    if (!existente) {
      return { error: "Servicio no encontrado" };
    }

    const prendaTipo = parsed.data.prendaTipo || existente.prendaTipo;
    const prendaDescripcion = parsed.data.prendaDescripcion || existente.prendaDescripcion;
    const trabajoSolicitado = parsed.data.trabajoSolicitado || existente.trabajoSolicitado;
    const valorCotizado = parsed.data.valorCotizado ? parseFloat(parsed.data.valorCotizado) : parseFloat(existente.valorCotizado.toString());
    const anticipo = parsed.data.anticipo ? parseFloat(parsed.data.anticipo) : parseFloat(existente.anticipo.toString());
    const saldoPendiente = valorCotizado - anticipo;

    const servicio = await prisma.servicioClinica.update({
      where: { id: servicioId },
      data: {
        prendaTipo,
        prendaDescripcion: prendaDescripcion || null,
        trabajoSolicitado,
        estado: parsed.data.estado as any,
        valorCotizado,
        anticipo,
        saldoPendiente,
      },
    });

    return { success: true, servicioId: servicio.id };
  } catch (error) {
    console.error("Error updating servicio:", error);
    return { error: "No se pudo actualizar el servicio" };
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
