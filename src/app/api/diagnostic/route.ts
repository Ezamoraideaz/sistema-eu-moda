import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Verificar conexión a BD
    const userCount = await prisma.user.count();
    const usuarios = await prisma.user.findMany({
      select: { id: true, email: true, nombre: true, role: true },
    });

    return Response.json({
      status: "OK",
      mensaje: "Conexión a BD funcionando",
      totalUsuarios: userCount,
      usuarios: usuarios,
    });
  } catch (error) {
    return Response.json(
      {
        status: "ERROR",
        mensaje: "Conexión a BD fallida",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
