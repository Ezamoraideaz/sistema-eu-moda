"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { searchClientes } from "@/app/(dashboard)/clientes/actions";

type ClienteResult = Awaited<ReturnType<typeof searchClientes>>[number];

export function ClientePicker({
  onSelect,
  placeholder = "Buscar cliente por nombre...",
}: {
  onSelect: (cliente: ClienteResult) => void;
  placeholder?: string;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClienteResult[]>([]);
  const [selected, setSelected] = useState<ClienteResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchClientes(query));
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm">
        <span className="font-medium text-gray-900">{selected.nombre}</span>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setQuery("");
          }}
          className="text-gray-500 hover:text-gray-900"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        id={inputId}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      {query.trim() && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-sm">
          {isPending && <li className="px-3 py-2 text-sm text-gray-500">Buscando...</li>}
          {!isPending && results.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Sin resultados.</li>}
          {results.map((cliente) => (
            <li key={cliente.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(cliente);
                  onSelect(cliente);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{cliente.nombre}</span>
                <span className="ml-2 text-gray-500">{cliente.documento ?? cliente.telefono ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
