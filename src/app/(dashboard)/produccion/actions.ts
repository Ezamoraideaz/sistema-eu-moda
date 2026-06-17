"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { crearOrdenSchema, actualizarOrdenSchema, crearGastoSchema } from "@/lib/validation/orden.schema";
import { auth } from "@/lib/auth";

export async function crearOrdenAction(data: unknown) {
  const session = await requireRole(["ADMIN", "RECEPCION"]);

  const parsed = crearOrdenSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { numero, clienteId, fechaEntrega, notas, productos } = parsed.data;

  try {
    const orden = await prisma.ordenProduccion.create({
      data: {
        numero,
        clienteId,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        notas: notas || null,
        productos: {
          create: productos.map((p) => {
            const unitario = parseFloat(p.valorUnitario);
            return {
              tipoPrenda: p.tipoPrenda,
              cantidad: p.cantidad,
              valorUnitario: unitario,
              total: unitario * p.cantidad,
            };
          }),
        },
      },
      include: { productos: true },
    });

    return { success: true, ordenId: orden.id };
  } catch (error) {
    console.error("Error creating orden:", error);
    return { error: "No se pudo crear la orden" };
  }
}

export async function actualizarOrdenAction(
  ordenId: string,
  data: unknown
) {
  const session = await requireRole(["ADMIN", "OPERARIO"]);

  const parsed = actualizarOrdenSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { numero, clienteId, fechaEntrega, estado, notas } = parsed.data;

  try {
    const orden = await prisma.ordenProduccion.update({
      where: { id: ordenId },
      data: {
        numero,
        clienteId,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        estado: estado as any,
        notas: notas || null,
      },
    });

    return { success: true, ordenId: orden.id };
  } catch (error) {
    console.error("Error updating orden:", error);
    return { error: "No se pudo actualizar la orden" };
  }
}

export async function crearGastoAction(data: unknown) {
  const session = await requireRole(["ADMIN"]);

  const parsed = crearGastoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { concepto, categoria, tipo, monto, fecha, ordenId, notas } = parsed.data;

  try {
    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        categoria,
        tipo: tipo as any,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        ordenId: ordenId || null,
        notas: notas || null,
        createdByUserId: session.user.id,
      },
    });

    return { success: true, gastoId: gasto.id };
  } catch (error) {
    console.error("Error creating gasto:", error);
    return { error: "No se pudo crear el gasto" };
  }
}

export async function agregarProductoOrdenAction(
  ordenId: string,
  tipoPrenda: string,
  cantidad: number,
  valorUnitario: string
) {
  const session = await requireRole(["ADMIN", "OPERARIO"]);

  try {
    const unitario = parseFloat(valorUnitario);
    const producto = await prisma.productoOrden.create({
      data: {
        ordenId,
        tipoPrenda,
        cantidad,
        valorUnitario: unitario,
        total: unitario * cantidad,
      },
    });

    return { success: true, productoId: producto.id };
  } catch (error) {
    console.error("Error adding producto:", error);
    return { error: "No se pudo agregar el producto" };
  }
}

export async function eliminarProductoOrdenAction(productoId: string) {
  const session = await requireRole(["ADMIN", "OPERARIO"]);

  try {
    await prisma.productoOrden.delete({
      where: { id: productoId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting producto:", error);
    return { error: "No se pudo eliminar el producto" };
  }
}
