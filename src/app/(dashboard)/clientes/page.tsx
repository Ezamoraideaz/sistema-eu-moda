import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession, PERMISSIONS } from "@/lib/auth-guards";

const TIPO_LABELS: Record<string, string> = { PERSONA: "Persona", EMPRESA: "Empresa" };

export default async function ClientesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const clientes: Awaited<ReturnType<typeof prisma.cliente.findMany>> = await prisma.cliente.findMany({
    where: q ? { nombre: { contains: q } } : undefined,
    orderBy: { nombre: "asc" },
    take: 50,
  });

  const puedeCrear = (PERMISSIONS.REGISTRAR_CLIENTE as readonly string[]).includes(session.user.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        {puedeCrear && (
          <Link href="/clientes/nuevo" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            Nuevo cliente
          </Link>
        )}
      </div>

      <form className="mt-4" action="/clientes">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Documento</th>
              <th className="px-4 py-2">Teléfono</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.map((cliente: typeof clientes[number]) => (
              <tr key={cliente.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/clientes/${cliente.id}`} className="font-medium text-gray-900 hover:underline">
                    {cliente.nombre}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{TIPO_LABELS[cliente.tipo]}</td>
                <td className="px-4 py-2 text-gray-600">{cliente.documento ?? "—"}</td>
                <td className="px-4 py-2 text-gray-600">{cliente.telefono ?? "—"}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
