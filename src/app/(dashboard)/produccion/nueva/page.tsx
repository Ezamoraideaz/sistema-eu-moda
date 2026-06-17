import { OrdenFormSimple } from "../orden-form-simple";

export default async function NuevaOrdenPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">Nueva orden de producción</h1>
      <div className="mt-6">
        <OrdenFormSimple />
      </div>
    </div>
  );
}
