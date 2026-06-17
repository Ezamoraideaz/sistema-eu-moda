import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-guards";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FotoUpload } from "@/components/fotos/foto-upload";
import { agregarFotoServicioAction, eliminarFotoServicioAction } from "../actions";
import { CambiarEstadoClinica } from "../cambiar-estado-clinica";

export default async function ServicioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole(["ADMIN", "OPERARIO", "RECEPCION"]);

  const servicio = await prisma.servicioClinica.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      items: {
        orderBy: { createdAt: "asc" },
      },
      fotos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!servicio) {
    notFound();
  }

  const fotoAntes = servicio.fotos.find((f) => f.tipo === "ANTES");
  const fotosDespues = servicio.fotos.filter((f) => f.tipo === "DESPUES");

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

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: "bg-yellow-50 border-yellow-200",
      EN_PRODUCCION: "bg-blue-50 border-blue-200",
      COMPLETADA: "bg-green-50 border-green-200",
      ENTREGADA: "bg-purple-50 border-purple-200",
      CANCELADA: "bg-red-50 border-red-200",
    };
    return colors[estado] || "bg-gray-50 border-gray-200";
  };

  const prendas = servicio.items.map((i) => i.prendaTipo).join(", ");
  const totalValor = servicio.items.reduce(
    (sum, item) => sum + parseFloat(item.valorCotizado.toString()),
    0
  );
  const totalAnticipo = servicio.items.reduce(
    (sum, item) => sum + parseFloat(item.anticipo.toString()),
    0
  );
  const totalSaldo = totalValor - totalAnticipo;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {prendas}
            </h1>
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              ID: {servicio.id.slice(0, 8)}
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            {servicio.cliente.nombre} · {servicio.items.length} prenda{servicio.items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/clinica"
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          ← Volver
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Estado y cambio de estado */}
          <div className={`rounded-lg border p-6 ${getEstadoColor(servicio.estado)}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado actual</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {getEstadoLabel(servicio.estado)}
                </p>
              </div>
              <CambiarEstadoClinica servicioId={servicio.id} estadoActual={servicio.estado} />
            </div>
          </div>

          {/* Fotos */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Fotos del servicio</h2>

            <div className="space-y-6">
              {/* Foto ANTES */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 font-medium text-gray-900">Foto ANTES</h3>
                {fotoAntes ? (
                  <div className="space-y-2">
                    <img
                      src={fotoAntes.url}
                      alt="Antes"
                      className="h-80 w-full rounded-md object-cover"
                    />
                    <form
                      action={async () => {
                        "use server";
                        await eliminarFotoServicioAction(fotoAntes.id);
                      }}
                      className="mt-2"
                    >
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        🗑️ Eliminar foto
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                    <p className="text-sm text-gray-600">Sin foto ANTES</p>
                  </div>
                )}
              </div>

              {/* Fotos DESPUÉS */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 font-medium text-gray-900">
                  Fotos DESPUÉS ({fotosDespues.length})
                </h3>
                {fotosDespues.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fotosDespues.map((foto) => (
                      <div key={foto.id} className="space-y-2">
                        <img
                          src={foto.url}
                          alt="Después"
                          className="h-64 w-full rounded-md object-cover"
                        />
                        <form
                          action={async () => {
                            "use server";
                            await eliminarFotoServicioAction(foto.id);
                          }}
                          className="mt-2"
                        >
                          <button
                            type="submit"
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            🗑️ Eliminar
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                    <p className="text-sm text-gray-600">Sin fotos DESPUÉS</p>
                  </div>
                )}
              </div>

              {/* Upload de fotos */}
              <div className="space-y-4">
                {!fotoAntes && (
                  <FotoUploadClient servicioId={servicio.id} tipo="ANTES" />
                )}
                <FotoUploadClient servicioId={servicio.id} tipo="DESPUES" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar con detalles */}
        <div className="space-y-6">
          {/* Cliente */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Cliente</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Nombre</p>
                <p className="font-medium text-gray-900">{servicio.cliente.nombre}</p>
              </div>
              {servicio.cliente.telefono && (
                <div>
                  <p className="text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{servicio.cliente.telefono}</p>
                </div>
              )}
              {servicio.cliente.correo && (
                <div>
                  <p className="text-gray-600">Correo</p>
                  <p className="font-medium text-gray-900 break-all">
                    {servicio.cliente.correo}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Detalles de prendas */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Prendas y trabajos</h3>
            <div className="space-y-4">
              {servicio.items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-100 p-3 space-y-2 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900">
                      {index + 1}. {item.prendaTipo}
                      {item.prendaDescripcion && (
                        <span className="ml-2 text-sm text-gray-600">
                          ({item.prendaDescripcion})
                        </span>
                      )}
                    </h4>
                    <span className="text-sm font-medium text-gray-900">
                      ${parseFloat(item.valorCotizado.toString()).toLocaleString("es-CO", {
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.trabajoSolicitado}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Costos */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Totales</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <p className="text-gray-600">Total cotizado</p>
                <p className="font-medium text-gray-900">
                  ${totalValor.toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Total anticipos</p>
                <p className="font-medium text-gray-900">
                  ${totalAnticipo.toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <p className="text-gray-600">Saldo pendiente</p>
                <p className="font-medium text-gray-900">
                  ${totalSaldo.toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Fechas</h3>
            <div className="space-y-3 text-sm">
              {servicio.fechaEntregaEstimada && (
                <div>
                  <p className="text-gray-600">Entrega estimada</p>
                  <p className="font-medium text-gray-900">
                    {servicio.fechaEntregaEstimada.toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Creado</p>
                <p className="font-medium text-gray-900">
                  {servicio.createdAt.toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FotoUploadClient({
  servicioId,
  tipo,
}: {
  servicioId: string;
  tipo: "ANTES" | "DESPUES";
}) {
  const handleUpload = async (url: string) => {
    await agregarFotoServicioAction(servicioId, url, tipo);
    window.location.reload();
  };

  return <FotoUpload tipo={tipo} onUpload={handleUpload} />;
}
