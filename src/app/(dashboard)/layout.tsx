import { requireSession } from "@/lib/auth-guards";
import { logoutAction } from "./logout-action";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  OPERARIO: "Operario",
  RECEPCION: "Recepción",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Capa 2 de control de acceso (ver Sección 4 del plan): el proxy ya
  // redirige a /login si no hay sesión, pero cada entry point del árbol
  // de render debe volver a verificar por su cuenta.
  const session = await requireSession();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white px-4 py-6">
        <div className="text-lg font-semibold text-gray-900">EU Moda ERP</div>
        <nav className="mt-8 flex flex-1 flex-col gap-1 text-sm">
          <a href="/" className="rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-100">
            Dashboard
          </a>
          <a href="/clientes" className="rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-100">
            Clientes
          </a>
          <a href="/produccion" className="rounded-md px-3 py-2 font-medium text-gray-700 hover:bg-gray-100">
            Producción
          </a>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="text-sm text-gray-600">
            {session.user.name} · {ROLE_LABELS[session.user.role] ?? session.user.role}
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Cerrar sesión
            </button>
          </form>
        </header>

        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
