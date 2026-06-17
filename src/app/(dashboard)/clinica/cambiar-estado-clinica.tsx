"use client";

import { useState } from "react";
import { actualizarServicioClinicaAction } from "./actions";

const ESTADO_FLOW = {
  PENDIENTE: ["EN_PRODUCCION", "CANCELADA"],
  EN_PRODUCCION: ["COMPLETADA", "CANCELADA"],
  COMPLETADA: ["ENTREGADA"],
  ENTREGADA: ["PENDIENTE"],
  CANCELADA: ["PENDIENTE"],
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PRODUCCION: "En producción",
  COMPLETADA: "Completada",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

export function CambiarEstadoClinica({
  servicioId,
  estadoActual,
}: {
  servicioId: string;
  estadoActual: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proximosEstados = ESTADO_FLOW[estadoActual as keyof typeof ESTADO_FLOW] || [];

  const handleCambiar = async (nuevoEstado: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await actualizarServicioClinicaAction(servicioId, {
        estado: nuevoEstado,
        prendaTipo: "", // Se obtiene del servidor
        trabajoSolicitado: "", // Se obtiene del servidor
        valorCotizado: "0",
        anticipo: "0",
      });

      if (result.error) {
        setError("No se pudo cambiar el estado");
      } else {
        setOpen(false);
        // Recargar página
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  if (proximosEstados.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        📝 Cambiar estado
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-3">
            {error && (
              <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              {proximosEstados.map((estado) => (
                <button
                  key={estado}
                  onClick={() => handleCambiar(estado)}
                  disabled={loading}
                  className="block w-full rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50 font-medium text-gray-900"
                >
                  {ESTADO_LABELS[estado]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
