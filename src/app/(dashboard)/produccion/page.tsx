import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession, PERMISSIONS } from "@/lib/auth-guards";

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PRODUCCION: "En Producción",
  COMPLETADA: "Completada",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  EN_PRODUCCION: "bg-blue-100 text-blue-800",
  COMPLETADA: "bg-green-100 text-green-800",
  ENTREGADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export default async function ProduccionPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const ordenes = await prisma.ordenProduccion.findMany({
    where: q
      ? {
          OR: [
            { numero: { contains: q } },
            { cliente: { nombre: { contains: q } } },
          ],
        }
      : undefined,
    include: {
      cliente: true,
      productos: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const puedeCrear = (PERMISSIONS.CREAR_ORDEN as readonly string[]).includes(session.user.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Producción por Lotes</h1>
        {puedeCrear && (
          <Link
            href="/produccion/nueva"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Nueva orden
          </Link>
        )}
      </div>

      <form className="mt-4" action="/produccion">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por número o cliente..."
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Número</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Productos</th>
              <th className="px-4 py-2">Ingreso</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Fecha Entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ordenes.map((orden) => {
              const totalIngresos = orden.productos.reduce(
                (sum, p) => sum + Number(p.total),
                0
              );
              return (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/produccion/${orden.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {orden.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{orden.cliente.nombre}</td>
                  <td className="px-4 py-2 text-gray-600">{orden.productos.length}</td>
                  <td className="px-4 py-2 text-gray-600">
                    ${totalIngresos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        ESTADO_COLORS[orden.estado] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {ESTADO_LABELS[orden.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {orden.fechaEntrega
                      ? new Date(orden.fechaEntrega).toLocaleDateString("es-CO")
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No se encontraron órdenes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
