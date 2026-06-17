import { z } from "zod";

const optionalText = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z.string().trim().max(200).optional(),
);

const optionalEmail = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z.string().email("Correo inválido").optional(),
);

export const clienteSchema = z
  .object({
    tipo: z.enum(["PERSONA", "EMPRESA"]),
    nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
    documento: optionalText,
    telefono: optionalText,
    whatsapp: optionalText,
    correo: optionalEmail,
    direccion: optionalText,
    contactoNombre: optionalText,
    contactoTelefono: optionalText,
  })
  .check((ctx) => {
    if (ctx.value.tipo === "EMPRESA" && !ctx.value.documento) {
      ctx.issues.push({
        code: "custom",
        message: "El NIT es obligatorio para clientes tipo empresa.",
        path: ["documento"],
        input: ctx.value.documento,
      });
    }
  });

export type ClienteInput = z.infer<typeof clienteSchema>;
