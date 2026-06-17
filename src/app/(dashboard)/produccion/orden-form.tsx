"use client";

import { useState } from "react";
import { crearOrdenAction, actualizarOrdenAction } from "./actions";
import { ClientePicker } from "@/components/clientes/cliente-picker";

interface OrdenFormProps {
  clientePre?: string;
  onSuccess?: (ordenId: string) => void;
  editar?: {
    id: string;
    numero: string;
    clienteId: string;
    fechaEntrega: string | null;
    estado: string;
    notas: string | null;
  };
}

export function OrdenForm({ clientePre, onSuccess, editar }: OrdenFormProps) {
  const [clienteId, setClienteId] = useState(editar?.clienteId || clientePre || "");
  const [numero, setNumero] = useState(editar?.numero || "");
  const [fechaEntrega, setFechaEntrega] = useState(editar?.fechaEntrega || "");
  const [notas, setNotas] = useState(editar?.notas || "");
  const [estado, setEstado] = useState(editar?.estado || "PENDIENTE");
  const [productos, setProductos] = useState<Array<{ tipoPrenda: string; cantidad: number; valorUnitario: string }>>([
    { tipoPrenda: "", cantidad: 1, valorUnitario: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agregarProducto = () => {
    setProductos([...productos, { tipoPrenda: "", cantidad: 1, valorUnitario: "" }]);
  };

  const quitarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (editar) {
        result = await actualizarOrdenAction(editar.id, {
          numero,
          clienteId,
          fechaEntrega,
          estado,
          notas,
        });
      } else {
        result = await crearOrdenAction({
          numero,
          clienteId,
          fechaEntrega,
          notas,
          productos,
        });
      }

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Error en el formulario");
      } else if (result.ordenId) {
        onSuccess?.(editar?.id || result.ordenId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Número de orden *
          </label>
          <input
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cliente *
          </label>
          <ClientePicker
            onSelect={(cliente) => setClienteId(cliente.id)}
            placeholder={clienteId ? "Seleccionado" : "Buscar cliente..."}
          />
        </div>

        {editar && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PRODUCCION">En Producción</option>
              <option value="COMPLETADA">Completada</option>
              <option value="ENTREGADA">Entregada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha de entrega
          </label>
          <input
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {!editar && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Productos</h3>
          {productos.map((producto, index) => (
            <div key={index} className="space-y-2 rounded-md border border-gray-200 p-4">
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Tipo de prenda"
                  value={producto.tipoPrenda}
                  onChange={(e) => {
                    const newProductos = [...productos];
                    newProductos[index].tipoPrenda = e.target.value;
                    setProductos(newProductos);
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={producto.cantidad}
                  onChange={(e) => {
                    const newProductos = [...productos];
                    newProductos[index].cantidad = parseInt(e.target.value) || 1;
                    setProductos(newProductos);
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  min="1"
                  required
                />
                <input
                  type="number"
                  placeholder="Valor unitario"
                  value={producto.valorUnitario}
                  onChange={(e) => {
                    const newProductos = [...productos];
                    newProductos[index].valorUnitario = e.target.value;
                    setProductos(newProductos);
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  step="0.01"
                  required
                />
              </div>
              {productos.length > 1 && (
                <button
                  type="button"
                  onClick={() => quitarProducto(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Quitar producto
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={agregarProducto}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Agregar producto
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Guardando..." : editar ? "Actualizar orden" : "Crear orden"}
      </button>
    </form>
  );
}
