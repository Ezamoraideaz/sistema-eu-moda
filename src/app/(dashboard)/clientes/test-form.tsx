"use client";

import { useState } from "react";
import { createCliente } from "./actions";

export function TestForm() {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("📤 Enviando...");

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("tipo", "PERSONA");

      const result = await createCliente(undefined, formData);

      if (result?.success) {
        setMessage("✅ Cliente guardado!");
        setNombre("");
      } else if (result?.error) {
        setMessage(`❌ Error: ${result.error}`);
      } else if (result?.fieldErrors) {
        setMessage(`⚠️ Validación: ${JSON.stringify(result.fieldErrors)}`);
      } else {
        setMessage("❓ Respuesta desconocida: " + JSON.stringify(result));
      }
    } catch (error) {
      setMessage(`💥 Excepción: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-blue-300 rounded bg-blue-50">
      <h2 className="font-bold text-blue-900">🧪 FORMULARIO DE PRUEBA</h2>

      <div>
        <label className="block font-medium">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Juan Pérez"
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      {message && (
        <div className={`p-3 rounded font-medium ${
          message.includes("✅") ? "bg-green-100 text-green-800" :
          message.includes("❌") ? "bg-red-100 text-red-800" :
          message.includes("📤") ? "bg-yellow-100 text-yellow-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "⏳ Enviando..." : "📬 Crear (PRUEBA)"}
      </button>
    </form>
  );
}
