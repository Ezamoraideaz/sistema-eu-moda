import { requireRole, PERMISSIONS } from "@/lib/auth-guards";
import { createCliente } from "../actions";
import { ClienteForm } from "../cliente-form";

export default async function NuevoClientePage() {
  await requireRole(PERMISSIONS.REGISTRAR_CLIENTE);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Nuevo cliente</h1>
      <div className="mt-4">
        <ClienteForm action={createCliente} submitLabel="Crear cliente" />
      </div>
    </div>
  );
}
