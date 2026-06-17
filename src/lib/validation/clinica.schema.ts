import { z } from "zod";

export const crearServicioClinicaSchema = z.object({
  clienteId: z.string().min(1, "Cliente requerido"),
  prendaTipo: z.string().min(1, "Tipo de prenda requerido"),
  prendaDescripcion: z.string().optional(),
  trabajoSolicitado: z.string().min(1, "Trabajo solicitado requerido"),
  valorCotizado: z.coerce
    .string()
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      "Valor debe ser positivo"
    ),
  anticipo: z.coerce
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Anticipo no válido")
    .optional()
    .default("0"),
  fechaEntregaEstimada: z.string().optional(),
});

export const actualizarServicioClinicaSchema = z.object({
  prendaTipo: z.string().optional(),
  prendaDescripcion: z.string().optional(),
  trabajoSolicitado: z.string().optional(),
  estado: z.enum(["PENDIENTE", "EN_PRODUCCION", "COMPLETADA", "ENTREGADA", "CANCELADA"]),
  valorCotizado: z.coerce.string().optional(),
  anticipo: z.coerce.string().optional(),
});

export type CrearServicioClinicaInput = z.infer<typeof crearServicioClinicaSchema>;
export type ActualizarServicioClinicaInput = z.infer<typeof actualizarServicioClinicaSchema>;
