import { TestOrdenForm } from "../test-orden";

export default async function NuevaOrdenPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Nueva orden de producción</h1>
      <TestOrdenForm />
    </div>
  );
}
