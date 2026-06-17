import { redirect } from "next/navigation";
import { OrdenForm } from "../orden-form";
import { requireSession } from "@/lib/auth-guards";

export default async function NuevaOrdenPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const searchParams = await props.searchParams;
  const clientePre = typeof searchParams.cliente === "string" ? searchParams.cliente : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">Nueva orden de producción</h1>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <OrdenForm
          clientePre={clientePre}
          onSuccess={(ordenId) => redirect(`/produccion/${ordenId}`)}
        />
      </div>
    </div>
  );
}
