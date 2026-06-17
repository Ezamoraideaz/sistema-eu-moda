import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { calcularRentabilidadOrden } from "@/lib/services/rentabilidad";

export default async function DetalleOrdenPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const params = await props.params;
  const { id } = params;

  const orden = await prisma.ordenProduccion.findUnique({
    where: { id },
    include: {
      cliente: true,
      productos: true,
      gastos: true,
    },
  });

  if (!orden) {
    notFound();
  }

  const rentabilidad = await calcularRentabilidadOrden(id);
  const totalIngresos = orden.productos.reduce((sum: number, p: typeof orden.productos[number]) => sum + Number(p.total), 0);

  const ESTADO_LABELS: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PRODUCCION: "En Producción",
    COMPLETADA: "Completada",
    ENTREGADA: "Entregada",
    CANCELADA: "Cancelada",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orden #{orden.numero}</h1>
            <p className="mt-1 text-sm text-gray-600">{orden.cliente.nombre}</p>
          </div>
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
            {ESTADO_LABELS[orden.estado]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 text-sm">
          <div>
            <p className="text-gray-600">Ingreso Total</p>
            <p className="text-lg font-semibold text-gray-900">
              ${totalIngresos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Productos</p>
            <p className="text-lg font-semibold text-gray-900">{orden.productos.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Fecha Entrega</p>
            <p className="text-lg font-semibold text-gray-900">
              {orden.fechaEntrega
                ? new Date(orden.fechaEntrega).toLocaleDateString("es-CO")
                : "No definida"}
            </p>
          </div>
        </div>

        {orden.notas && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700">Notas</p>
            <p className="mt-1 text-sm text-gray-600">{orden.notas}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Productos</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2">Tipo de prenda</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Valor unitario</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orden.productos.map((producto: typeof orden.productos[number]) => (
                <tr key={producto.id}>
                  <td className="px-4 py-2">{producto.tipoPrenda}</td>
                  <td className="px-4 py-2">{producto.cantidad}</td>
                  <td className="px-4 py-2">
                    ${Number(producto.valorUnitario).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    ${Number(producto.total).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rentabilidad && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Rentabilidad</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Ingresos</p>
              <p className="text-lg font-semibold text-gray-900">
                ${Number(rentabilidad.ingresos).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Costos variables</p>
              <p className="text-lg font-semibold text-gray-900">
                ${Number(rentabilidad.costosVariables).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Costos indirectos (prorrateados)</p>
              <p className="text-lg font-semibold text-gray-900">
                ${Number(rentabilidad.costosIndirectos).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Costo total</p>
              <p className="text-lg font-semibold text-gray-900">
                ${Number(rentabilidad.costoTotal).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Margen bruto</p>
              <p className="text-lg font-semibold text-green-600">
                ${Number(rentabilidad.margenBruto).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Margen neto</p>
              <p className={`text-lg font-semibold ${Number(rentabilidad.margenNeto) >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${Number(rentabilidad.margenNeto).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">% Margen neto</p>
              <p className={`text-lg font-semibold ${Number(rentabilidad.porcentajeMargenNeto) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {Number(rentabilidad.porcentajeMargenNeto).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Información de la orden</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Cliente</p>
            <p className="text-gray-900">{orden.cliente.nombre}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Fecha de ingreso</p>
            <p className="text-gray-900">{new Date(orden.fechaIngreso).toLocaleDateString("es-CO")}</p>
          </div>
          {orden.notas && (
            <div>
              <p className="text-sm font-medium text-gray-700">Notas</p>
              <p className="text-gray-900">{orden.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
