"use client";

import { useState } from "react";
import { crearServicioClinicaAction } from "./actions";
import { ClientePicker } from "@/components/clientes/cliente-picker";

interface Item {
  id: string;
  prendaTipo: string;
  prendaDescripcion: string;
  trabajoSolicitado: string;
  valorCotizado: string;
  anticipo: string;
}

export function ServicioForm({ onSuccess }: { onSuccess?: (servicioId: string) => void }) {
  const [clienteId, setClienteId] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [items, setItems] = useState<Item[]>([
    {
      id: "1",
      prendaTipo: "",
      prendaDescripcion: "",
      trabajoSolicitado: "",
      valorCotizado: "",
      anticipo: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleItemChange = (id: string, field: keyof Item, value: string) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        prendaTipo: "",
        prendaDescripcion: "",
        trabajoSolicitado: "",
        valorCotizado: "",
        anticipo: "",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await crearServicioClinicaAction({
        clienteId,
        fechaEntregaEstimada: fechaEntrega,
        items: items.map(({ id, ...rest }) => rest),
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

  const totalCotizado = items.reduce((sum, item) => sum + (parseFloat(item.valorCotizado) || 0), 0);
  const totalAnticipo = items.reduce((sum, item) => sum + (parseFloat(item.anticipo) || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente *</label>
          <ClientePicker
            onSelect={(cliente) => setClienteId(cliente.id)}
            placeholder="Buscar cliente..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de entrega</label>
          <input
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Prendas</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Agregar prenda
          </button>
        </div>

        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Prenda {index + 1}</h4>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de prenda *
                </label>
                <input
                  type="text"
                  value={item.prendaTipo}
                  onChange={(e) => handleItemChange(item.id, "prendaTipo", e.target.value)}
                  placeholder="Ej: Pantalón, Camisa"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  value={item.prendaDescripcion}
                  onChange={(e) =>
                    handleItemChange(item.id, "prendaDescripcion", e.target.value)
                  }
                  placeholder="Color, marca, etc."
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trabajo solicitado *
              </label>
              <textarea
                value={item.trabajoSolicitado}
                onChange={(e) => handleItemChange(item.id, "trabajoSolicitado", e.target.value)}
                placeholder="Describe qué necesita arreglarse..."
                rows={2}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor *</label>
                <input
                  type="number"
                  value={item.valorCotizado}
                  onChange={(e) => handleItemChange(item.id, "valorCotizado", e.target.value)}
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
                  value={item.anticipo}
                  onChange={(e) => handleItemChange(item.id, "anticipo", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="rounded-lg bg-blue-50 p-4 space-y-2 border border-blue-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total cotizado</span>
          <span className="font-medium text-gray-900">
            ${totalCotizado.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total anticipos</span>
          <span className="font-medium text-gray-900">
            ${totalAnticipo.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
          </span>
        </div>
        <div className="border-t border-blue-200 pt-2 flex justify-between text-sm font-semibold">
          <span className="text-gray-900">Saldo pendiente</span>
          <span className="text-gray-900">
            ${(totalCotizado - totalAnticipo).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
          </span>
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
