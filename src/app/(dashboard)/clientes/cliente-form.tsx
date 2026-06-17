"use client";

import { useActionState, useState, useEffect } from "react";
import type { ClienteFormState } from "./actions";

type ClienteDefaults = {
  id?: string;
  tipo?: "PERSONA" | "EMPRESA";
  nombre?: string;
  documento?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  correo?: string | null;
  direccion?: string | null;
  contactoNombre?: string | null;
  contactoTelefono?: string | null;
};

export function ClienteForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ClienteFormState, formData: FormData) => Promise<ClienteFormState>;
  defaultValues?: ClienteDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [tipo, setTipo] = useState<"PERSONA" | "EMPRESA">(defaultValues?.tipo ?? "PERSONA");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const fieldErrors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.success) {
      setSuccessMessage("✅ Cliente guardado exitosamente. Redirigiendo...");
      const timer = setTimeout(() => {
        if (state.clienteId) {
          window.location.href = `/clientes/${state.clienteId}`;
        } else {
          window.location.href = "/clientes";
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, state?.clienteId]);

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 font-medium">
          {successMessage}
        </div>
      )}

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 font-medium">
          ❌ Error: {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo de cliente</label>
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "PERSONA" | "EMPRESA")}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="PERSONA">Persona</option>
          <option value="EMPRESA">Empresa</option>
        </select>
      </div>

      {/* CAMPOS COMUNES */}
      <Field label={tipo === "EMPRESA" ? "Razón social" : "Nombre"} name="nombre" defaultValue={defaultValues?.nombre} errors={fieldErrors.nombre} required />
      <Field label="Teléfono" name="telefono" defaultValue={defaultValues?.telefono} errors={fieldErrors.telefono} required />
      <Field label="Correo" name="correo" type="email" defaultValue={defaultValues?.correo} errors={fieldErrors.correo} />

      {/* CAMPOS SOLO PARA EMPRESA */}
      {tipo === "EMPRESA" && (
        <>
          <Field label="NIT" name="documento" defaultValue={defaultValues?.documento} errors={fieldErrors.documento} required />
          <Field label="Dirección" name="direccion" defaultValue={defaultValues?.direccion} errors={fieldErrors.direccion} />
          <Field label="Nombre de contacto" name="contactoNombre" defaultValue={defaultValues?.contactoNombre} errors={fieldErrors.contactoNombre} />
          <Field label="Teléfono de contacto" name="contactoTelefono" defaultValue={defaultValues?.contactoTelefono} errors={fieldErrors.contactoTelefono} />
        </>
      )}

      {/* CAMPO OCULTO PARA PERSONA (enviar null) */}
      {tipo === "PERSONA" && (
        <>
          <input type="hidden" name="documento" value="" />
          <input type="hidden" name="whatsapp" value="" />
          <input type="hidden" name="direccion" value="" />
          <input type="hidden" name="contactoNombre" value="" />
          <input type="hidden" name="contactoTelefono" value="" />
        </>
      )}

      <button
        type="submit"
        disabled={pending || !!successMessage}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "⏳ Guardando..." : successMessage ? "✅ Guardado" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  errors,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  errors?: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      {errors?.map((message) => (
        <p key={message} className="mt-1 text-sm text-red-600">
          {message}
        </p>
      ))}
    </div>
  );
}
