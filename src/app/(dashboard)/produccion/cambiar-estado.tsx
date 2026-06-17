"use client";

import { useState } from "react";
import { actualizarOrdenAction } from "./actions";

interface CambiarEstadoProps {
  ordenId: string;
  estadoActual: string;
  numero: string;
  clienteId: string;
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PRODUCCION: "En Producción",
  COMPLETADA: "Completada",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

const ESTADOS = ["PENDIENTE", "EN_PRODUCCION", "COMPLETADA", "ENTREGADA", "CANCELADA"];

export function CambiarEstado({
  ordenId,
  estadoActual,
  numero,
  clienteId,
}: CambiarEstadoProps) {
  const [nuevoEstado, setNuevoEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await actualizarOrdenAction(ordenId, {
        numero,
        clienteId,
        estado: nuevoEstado as any,
      });

      if (result?.error) {
        setMessage(`❌ Error: ${result.error}`);
      } else {
        setMessage("✅ Estado actualizado. Recargando...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Cambiar estado de la orden</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado actual: <span className="font-bold">{ESTADO_LABELS[estadoActual]}</span>
        </label>
        <select
          value={nuevoEstado}
          onChange={(e) => setNuevoEstado(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        >
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-sm font-medium ${
            message.includes("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || nuevoEstado === estadoActual}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "⏳ Actualizando..." : "✅ Cambiar estado"}
      </button>
    </form>
  );
}
