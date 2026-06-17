export interface OrdenData {
  id: string;
  ingresos: number;
  estado: string;
  fechaIngreso: Date;
  fechaEntrega: Date | null;
}

export interface GastoData {
  monto: number;
  fecha: Date;
}

export function calcularProrrateoMensual(
  mes: Date,
  gastosFijos: GastoData[],
  ordenesActivas: OrdenData[]
): Map<string, number> {
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

  const totalFijosDelMes = gastosFijos
    .filter((g) => {
      const fecha = new Date(g.fecha);
      return fecha >= primerDia && fecha <= ultimoDia;
    })
    .reduce((sum, g) => sum + g.monto, 0);

  const ordenesDelMes = ordenesActivas.filter((o) => {
    const inicio = new Date(o.fechaIngreso);
    const fin = o.fechaEntrega ? new Date(o.fechaEntrega) : new Date();
    return !(fin < primerDia || inicio > ultimoDia);
  });

  if (ordenesDelMes.length === 0 || totalFijosDelMes === 0) {
    return new Map();
  }

  const totalIngresos = ordenesDelMes.reduce(
    (sum, o) => sum + o.ingresos,
    0
  );

  const prorrateo = new Map<string, number>();

  for (const orden of ordenesDelMes) {
    const proporcion = orden.ingresos / totalIngresos;
    const costoIndirecto = totalFijosDelMes * proporcion;
    prorrateo.set(orden.id, costoIndirecto);
  }

  return prorrateo;
}

export function calcularProrrateoParaOrden(
  ordenId: string,
  mes: Date,
  totalFijosDelMes: number,
  ingresoOrden: number,
  totalIngresosDelMes: number
): number {
  if (totalIngresosDelMes === 0) {
    return 0;
  }

  const proporcion = ingresoOrden / totalIngresosDelMes;
  return totalFijosDelMes * proporcion;
}
