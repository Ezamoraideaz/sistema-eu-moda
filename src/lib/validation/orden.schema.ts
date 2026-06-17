import { z } from "zod";

export const productoOrdenSchema = z.object({
  tipoPrenda: z.string().min(1, "Tipo de prenda requerido"),
  cantidad: z.coerce.number().int().positive("Cantidad debe ser positiva"),
  valorUnitario: z.coerce
    .string()
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      "Valor unitario debe ser positivo"
    ),
});

export const crearOrdenSchema = z.object({
  numero: z.string().min(1, "Número de orden requerido"),
  clienteId: z.string().min(1, "Cliente requerido"),
  fechaEntrega: z.string().optional(),
  notas: z.string().optional(),
  productos: z
    .array(productoOrdenSchema)
    .min(1, "Al menos un producto requerido"),
});

export const actualizarOrdenSchema = z.object({
  numero: z.string().min(1, "Número de orden requerido"),
  clienteId: z.string().min(1, "Cliente requerido"),
  fechaEntrega: z.string().optional(),
  estado: z.enum(["PENDIENTE", "EN_PRODUCCION", "COMPLETADA", "ENTREGADA", "CANCELADA"]),
  notas: z.string().optional(),
});

export const crearGastoSchema = z.object({
  concepto: z.string().min(1, "Concepto requerido"),
  categoria: z.string().min(1, "Categoría requerida"),
  tipo: z.enum(["FIJO", "VARIABLE"]),
  monto: z.coerce
    .string()
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      "Monto debe ser positivo"
    ),
  fecha: z.string().min(1, "Fecha requerida"),
  ordenId: z.string().optional(),
  notas: z.string().optional(),
});

export type CrearOrdenInput = z.infer<typeof crearOrdenSchema>;
export type ActualizarOrdenInput = z.infer<typeof actualizarOrdenSchema>;
export type CrearGastoInput = z.infer<typeof crearGastoSchema>;
export type ProductoOrdenInput = z.infer<typeof productoOrdenSchema>;
