"use client";

import { useActionState, useState } from "react";
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

  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

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

      <Field label={tipo === "EMPRESA" ? "Razón social" : "Nombre"} name="nombre" defaultValue={defaultValues?.nombre} errors={fieldErrors.nombre} required />
      <Field label={tipo === "EMPRESA" ? "NIT" : "Documento"} name="documento" defaultValue={defaultValues?.documento} errors={fieldErrors.documento} />
      <Field label="Teléfono" name="telefono" defaultValue={defaultValues?.telefono} errors={fieldErrors.telefono} />
      <Field label="WhatsApp" name="whatsapp" defaultValue={defaultValues?.whatsapp} errors={fieldErrors.whatsapp} />
      <Field label="Correo" name="correo" type="email" defaultValue={defaultValues?.correo} errors={fieldErrors.correo} />
      <Field label="Dirección" name="direccion" defaultValue={defaultValues?.direccion} errors={fieldErrors.direccion} />

      {tipo === "EMPRESA" && (
        <>
          <Field label="Nombre de contacto" name="contactoNombre" defaultValue={defaultValues?.contactoNombre} errors={fieldErrors.contactoNombre} />
          <Field label="Teléfono de contacto" name="contactoTelefono" defaultValue={defaultValues?.contactoTelefono} errors={fieldErrors.contactoTelefono} />
        </>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
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
        {label}
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
