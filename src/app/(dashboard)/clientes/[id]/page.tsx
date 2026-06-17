import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession, PERMISSIONS } from "@/lib/auth-guards";
import { updateCliente } from "../actions";
import { ClienteForm } from "../cliente-form";

const TIPO_LABELS: Record<string, string> = { PERSONA: "Persona", EMPRESA: "Empresa" };

export default async function ClienteDetailPage(props: PageProps<"/clientes/[id]">) {
  const session = await requireSession();
  const { id } = await props.params;

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  const puedeEditar = (PERMISSIONS.REGISTRAR_CLIENTE as readonly string[]).includes(session.user.role);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{cliente.nombre}</h1>
      <p className="mt-1 text-sm text-gray-500">{TIPO_LABELS[cliente.tipo]}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          {puedeEditar ? (
            <ClienteForm action={updateCliente} submitLabel="Guardar cambios" defaultValues={cliente} />
          ) : (
            <dl className="max-w-xl space-y-2 rounded-lg border border-gray-200 bg-white p-6 text-sm">
              <Detail label="Documento" value={cliente.documento} />
              <Detail label="Teléfono" value={cliente.telefono} />
              <Detail label="WhatsApp" value={cliente.whatsapp} />
              <Detail label="Correo" value={cliente.correo} />
              <Detail label="Dirección" value={cliente.direccion} />
            </dl>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">Historial</h2>
          <p className="mt-2 text-sm text-gray-500">
            Los servicios, pedidos y total gastado de este cliente se mostrarán aquí a medida que se construyan
            los módulos de Producción, Clínica de Ropa y Confección Personalizada.
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}
