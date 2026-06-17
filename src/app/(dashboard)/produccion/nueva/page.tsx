import { redirect } from "next/navigation";
import { OrdenForm } from "../orden-form";
import { TestOrdenForm } from "../test-orden";

export default async function NuevaOrdenPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const clientePre = typeof searchParams.cliente === "string" ? searchParams.cliente : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Nueva orden de producción</h1>

      <TestOrdenForm />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Formulario Normal</h2>
        <OrdenForm
          clientePre={clientePre}
          onSuccess={(ordenId) => redirect(`/produccion/${ordenId}`)}
        />
      </div>
    </div>
  );
}
