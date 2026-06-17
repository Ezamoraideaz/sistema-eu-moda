import { prisma } from "@/lib/db";
import { calcularProrrateoParaOrden } from "./prorrateo";

export interface RentabilidadOrden {
  ingresos: number;
  costosVariables: number;
  costosIndirectos: number;
  costoTotal: number;
  margenBruto: number;
  margenNeto: number;
  porcentajeMargenNeto: number;
}

export async function calcularRentabilidadOrden(
  ordenId: string
): Promise<RentabilidadOrden | null> {
  const orden = await prisma.ordenProduccion.findUnique({
    where: { id: ordenId },
    include: {
      productos: true,
      gastos: true,
    },
  });

  if (!orden) return null;

  const ingresos = orden.productos.reduce(
    (sum, p) => sum + Number(p.total),
    0
  );

  const costosVariables = orden.gastos
    .filter((g) => g.tipo === "VARIABLE")
    .reduce((sum, g) => sum + Number(g.monto), 0);

  const mes = orden.fechaIngreso;
  const totalFijosDelMes = await prisma.gasto.aggregate({
    where: {
      tipo: "FIJO",
      fecha: {
        gte: new Date(mes.getFullYear(), mes.getMonth(), 1),
        lte: new Date(mes.getFullYear(), mes.getMonth() + 1, 0),
      },
    },
    _sum: { monto: true },
  });

  const ordenesDelMes = await prisma.ordenProduccion.findMany({
    where: {
      estado: { not: "CANCELADA" },
      fechaIngreso: {
        gte: new Date(mes.getFullYear(), mes.getMonth(), 1),
        lte: new Date(mes.getFullYear(), mes.getMonth() + 1, 0),
      },
    },
    include: { productos: true },
  });

  const totalFijos = Number(totalFijosDelMes._sum.monto || 0);
  const totalIngresos = ordenesDelMes.reduce(
    (sum, o) => sum + o.productos.reduce((s, p) => s + Number(p.total), 0),
    0
  );

  const costosIndirectos = calcularProrrateoParaOrden(
    ordenId,
    mes,
    totalFijos,
    ingresos,
    totalIngresos
  );

  const costoTotal = costosVariables + costosIndirectos;
  const margenBruto = ingresos - costosVariables;
  const margenNeto = ingresos - costoTotal;

  const porcentajeMargenNeto =
    ingresos === 0
      ? 0
      : (margenNeto / ingresos) * 100;

  return {
    ingresos,
    costosVariables,
    costosIndirectos,
    costoTotal,
    margenBruto,
    margenNeto,
    porcentajeMargenNeto,
  };
}
