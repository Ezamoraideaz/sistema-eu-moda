"use client";

import { useRef, useState } from "react";
import { put } from "@vercel/blob/client";

interface FotoUploadProps {
  onUpload: (url: string, tipo: "ANTES" | "DESPUES") => void;
  tipo: "ANTES" | "DESPUES";
}

export function FotoUpload({ onUpload, tipo }: FotoUploadProps) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputFileRef.current?.files) {
      return;
    }

    const file = inputFileRef.current.files[0];
    if (!file) {
      setError("Selecciona una foto");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newBlob = await put(file.name, file, {
        access: "public",
        multipartThreshold: 4 * 1024 * 1024, // 4MB
      });

      onUpload(newBlob.url, tipo);

      if (inputFileRef.current) {
        inputFileRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-gray-200 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Foto {tipo === "ANTES" ? "ANTES" : "DESPUÉS"} *
        </label>
        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {uploading ? "⏳ Subiendo..." : `📸 Subir foto ${tipo}`}
      </button>
    </form>
  );
}
