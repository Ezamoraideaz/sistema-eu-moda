"use client";

import { useState } from "react";
import { crearServicioClinicaAction } from "./actions";
import { ClientePicker } from "@/components/clientes/cliente-picker";

export function ServicioForm({ onSuccess }: { onSuccess?: (servicioId: string) => void }) {
  const [clienteId, setClienteId] = useState("");
  const [prendaTipo, setPrendaTipo] = useState("");
  const [prendaDescripcion, setPrendaDescripcion] = useState("");
  const [trabajoSolicitado, setTrabajoSolicitado] = useState("");
  const [valorCotizado, setValorCotizado] = useState("");
  const [anticipo, setAnticipo] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await crearServicioClinicaAction({
        clienteId,
        prendaTipo,
        prendaDescripcion,
        trabajoSolicitado,
        valorCotizado,
        anticipo,
        fechaEntregaEstimada: fechaEntrega,
      });

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Error en el formulario");
      } else if (result.servicioId) {
        setSuccess(true);
        onSuccess?.(result.servicioId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 font-medium">
          ✅ Servicio creado exitosamente!
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 font-medium">
          ❌ Error: {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Cliente *</label>
        <ClientePicker
          onSelect={(cliente) => setClienteId(cliente.id)}
          placeholder="Buscar cliente..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de prenda *</label>
          <input
            type="text"
            value={prendaTipo}
            onChange={(e) => setPrendaTipo(e.target.value)}
            placeholder="Ej: Pantalón, Camisa"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <input
            type="text"
            value={prendaDescripcion}
            onChange={(e) => setPrendaDescripcion(e.target.value)}
            placeholder="Color, marca, etc."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Trabajo solicitado *</label>
        <textarea
          value={trabajoSolicitado}
          onChange={(e) => setTrabajoSolicitado(e.target.value)}
          placeholder="Describe qué necesita arreglarse..."
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor cotizado *</label>
          <input
            type="number"
            value={valorCotizado}
            onChange={(e) => setValorCotizado(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Anticipo</label>
          <input
            type="number"
            value={anticipo}
            onChange={(e) => setAnticipo(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha entrega</label>
          <input
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "⏳ Guardando..." : "✅ Crear servicio"}
      </button>
    </form>
  );
}
