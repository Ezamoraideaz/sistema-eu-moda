"use client";

import { useState, useEffect } from "react";
import { crearOrdenAction } from "./actions";
import { ClientePicker } from "@/components/clientes/cliente-picker";

export function OrdenFormSimple() {
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [productos, setProductos] = useState<Array<{ tipoPrenda: string; cantidad: number; valorUnitario: string }>>([
    { tipoPrenda: "", cantidad: 1, valorUnitario: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generar número de orden automáticamente
  useEffect(() => {
    if (!numero) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      setNumero(`ORD-${timestamp.toString().slice(-6)}-${random.toString().padStart(3, '0')}`);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await crearOrdenAction({
        numero,
        clienteId,
        fechaEntrega: "",
        notas: "",
        productos,
      });

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Error en el formulario");
      } else if (result.ordenId) {
        setSuccess(true);
        setNumero("");
        setClienteId("");
        setProductos([{ tipoPrenda: "", cantidad: 1, valorUnitario: "" }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const agregarProducto = () => {
    setProductos([...productos, { tipoPrenda: "", cantidad: 1, valorUnitario: "" }]);
  };

  const quitarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 font-medium">
          ✅ Orden creada exitosamente!
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
          onSelect={(cliente) => {
            setClienteId(cliente.id);
            setClienteNombre(cliente.nombre);
          }}
          placeholder="Buscar cliente por nombre, teléfono o NIT..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Número de orden (Generado automáticamente)</label>
        <input
          type="text"
          value={numero}
          disabled
          className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Se genera automáticamente al crear la orden</p>
      </div>

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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Crear orden"}
      </button>
    </form>
  );
}
