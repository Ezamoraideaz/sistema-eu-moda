import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import Link from "next/link";
import { ServicioForm } from "./servicio-form";

export default async function ClinicaPage() {
  await requireRole(["ADMIN", "OPERARIO", "RECEPCION"]);

  const servicios = await prisma.servicioClinica.findMany({
    include: {
      cliente: true,
      fotos: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: "bg-yellow-100 text-yellow-800",
      EN_PRODUCCION: "bg-blue-100 text-blue-800",
      COMPLETADA: "bg-green-100 text-green-800",
      ENTREGADA: "bg-purple-100 text-purple-800",
      CANCELADA: "bg-red-100 text-red-800",
    };
    return colors[estado] || "bg-gray-100 text-gray-800";
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      PENDIENTE: "Pendiente",
      EN_PRODUCCION: "En producción",
      COMPLETADA: "Completada",
      ENTREGADA: "Entregada",
      CANCELADA: "Cancelada",
    };
    return labels[estado] || estado;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clínica de Ropa</h1>
        <p className="mt-2 text-gray-600">
          Gestiona servicios de arreglos y costura personalizada
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Nuevo servicio</h2>
            <ServicioForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Servicios ({servicios.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {servicios.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No hay servicios registrados aún
                </div>
              ) : (
                servicios.map((servicio) => (
                  <Link
                    key={servicio.id}
                    href={`/clinica/${servicio.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">
                            {servicio.prendaTipo}
                            {servicio.prendaDescripcion && (
                              <span className="ml-2 text-sm text-gray-600">
                                ({servicio.prendaDescripcion})
                              </span>
                            )}
                          </h3>
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getEstadoColor(
                              servicio.estado
                            )}`}
                          >
                            {getEstadoLabel(servicio.estado)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {servicio.cliente.nombre}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            💰 ${parseFloat(servicio.valorCotizado.toString()).toLocaleString(
                              "es-CO",
                              {
                                minimumFractionDigits: 0,
                              }
                            )}
                          </span>
                          {servicio.fotos.length > 0 && (
                            <span>📸 {servicio.fotos.length} fotos</span>
                          )}
                          {servicio.fechaEntregaEstimada && (
                            <span>📅 {servicio.fechaEntregaEstimada.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
