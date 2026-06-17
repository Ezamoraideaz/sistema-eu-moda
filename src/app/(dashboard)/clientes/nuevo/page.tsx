import { requireRole, PERMISSIONS } from "@/lib/auth-guards";
import { createCliente } from "../actions";
import { ClienteForm } from "../cliente-form";
import { TestForm } from "../test-form";

export default async function NuevoClientePage() {
  await requireRole(PERMISSIONS.REGISTRAR_CLIENTE);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Nuevo cliente</h1>

      <TestForm />

      <div className="mt-6 pt-6 border-t">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Formulario Normal</h2>
        <ClienteForm action={createCliente} submitLabel="Crear cliente" />
      </div>
    </div>
  );
}
