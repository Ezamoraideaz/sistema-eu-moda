export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "NO DEFINIDA";

  // Ocultar credenciales en la respuesta
  const urlSafe = dbUrl.replace(/:[^:/@]+@/, ":***@");

  return Response.json({
    DATABASE_URL: urlSafe,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
