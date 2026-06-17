import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa JPEG, PNG o WebP" },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Error uploading blob:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Error al subir archivo" },
      { status: 400 }
    );
  }
}
