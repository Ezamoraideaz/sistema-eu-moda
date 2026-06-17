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
  .superRefine((data, ctx) => {
    if (data.tipo === "PERSONA") {
      // Para PERSONA: teléfono es obligatorio
      if (!data.telefono || data.telefono.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El teléfono es obligatorio para personas.",
          path: ["telefono"],
        });
      }
    } else if (data.tipo === "EMPRESA") {
      // Para EMPRESA: NIT y teléfono obligatorios
      if (!data.documento || data.documento.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El NIT es obligatorio para empresas.",
          path: ["documento"],
        });
      }
      if (!data.telefono || data.telefono.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El teléfono es obligatorio.",
          path: ["telefono"],
        });
      }
    }
  });

export type ClienteInput = z.infer<typeof clienteSchema>;
