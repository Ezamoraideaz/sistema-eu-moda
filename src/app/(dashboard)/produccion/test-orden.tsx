"use client";

import { useState } from "react";
import { crearOrdenAction } from "./actions";

export function TestOrdenForm() {
  const [numero, setNumero] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("📤 Enviando...");

    try {
      const result = await crearOrdenAction({
        numero,
        clienteId,
        fechaEntrega: "",
        notas: "",
        productos: [
          {
            tipoPrenda: "Camisa",
            cantidad: 1,
            valorUnitario: "50000",
          },
        ],
      });

      if (result?.success) {
        setMessage(`✅ Orden creada! ID: ${result.ordenId}`);
        setNumero("");
        setClienteId("");
      } else if (result?.error) {
        setMessage(`❌ Error: ${result.error}`);
      } else {
        setMessage("❓ Respuesta: " + JSON.stringify(result));
      }
    } catch (error) {
      setMessage(`💥 Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-purple-300 rounded bg-purple-50">
      <h2 className="font-bold text-purple-900">🧪 TEST ORDEN</h2>

      <div>
        <label className="block font-medium">Número</label>
        <input
          type="text"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="ORD-001"
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block font-medium">ID Cliente</label>
        <input
          type="text"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          placeholder="Pega aquí el ID del cliente"
          className="w-full border px-3 py-2 rounded text-sm"
          required
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded font-medium text-sm ${
            message.includes("✅")
              ? "bg-green-100 text-green-800"
              : message.includes("❌")
                ? "bg-red-100 text-red-800"
                : message.includes("📤")
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "⏳ Enviando..." : "📬 Crear Orden (TEST)"}
      </button>
    </form>
  );
}
