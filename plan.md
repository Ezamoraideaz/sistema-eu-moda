# EU Moda ERP — Plan de implementación

## Contexto

EU Moda es un taller de confecciones que necesita un sistema único para controlar producción por lotes, clínica de ropa, confección a medida, clientes, inventario, gastos y rentabilidad. Hoy todo esto se maneja sin un sistema centralizado. El proyecto parte de cero (carpeta vacía, sin repo git todavía).

Decisiones ya acordadas con el usuario:
- **Stack**: Next.js (App Router) + TypeScript + TailwindCSS, full-stack (sin backend Node separado).
- **Hosting**: Vercel, repo en GitHub, dominio personalizado.
- **Base de datos**: MySQL remoto en cPanel de HostGator (hosting compartido).
- **Storage de fotos**: Vercel Blob (el filesystem de Vercel es efímero, no sirve para guardar fotos en disco).
- **Enfoque**: diseñar el plan completo de los 8 módulos antes de construir, luego implementar por fases.

El objetivo de este plan es fijar la arquitectura, el modelo de datos y el orden de construcción antes de escribir código, y dejar explícito el mayor riesgo técnico (MySQL compartido de HostGator accedido desde funciones serverless de Vercel).

---

## Decisiones técnicas

| Punto | Decisión |
|---|---|
| API | Server Actions para mutaciones desde formularios; Route Handlers solo donde se necesite HTTP real (subida a Vercel Blob, exportación CSV, NextAuth) |
| ORM | Prisma + conector MySQL |
| Auth | Auth.js v5, Credentials provider, sesión JWT (sin adapter de Prisma — no hace falta, ahorra conexiones a BD) |
| Roles | Enum `Role { ADMIN OPERARIO RECEPCION }` en `User`, reforzado en middleware + guard de servidor en cada Server Action |
| Fotos | Vercel Blob, **subida directa desde el cliente** (evita el límite de 4.5MB de las funciones serverless) |
| Cliente | Una sola tabla `Cliente` unificada (con campos opcionales tipo NIT) usada por los 3 módulos de servicio |
| Costos | Una sola tabla `Gasto` compartida entre Módulo 2 (costos de orden) y Módulo 7 (gastos), con `tipo: FIJO | VARIABLE` |
| Medidas | Snapshots versionados: `MedidaSnapshot` (una sesión de medición por cliente/fecha) → muchas filas `Medida` (nombre libre + valor + unidad) |
| Prorrateo | Costos fijos del mes repartidos por participación en los ingresos del mes, calculado al vuelo (no se guarda en caché) |
| Orden de fases | Fundación → Clientes → Producción por Lotes → Clínica de Ropa → Confección Personalizada → Inventario → Gastos → Reportes → Dashboard |

---

## 1. Estructura del proyecto

```
eumoda-erp/
  prisma/
    schema.prisma
    migrations/
    seed.ts                      # primer usuario ADMIN + datos de ejemplo
  src/
    app/
      (auth)/login/page.tsx
      (dashboard)/
        layout.tsx                # sidebar/topbar, chequeo de sesión, nav según rol
        page.tsx                  # Módulo 1 Dashboard
        clientes/{page,[id]/page,actions}.ts
        produccion/{page,nueva/page,[id]/page,actions}.ts
        clinica/{page,nueva/page,[id]/page,actions}.ts
        confeccion/{page,[clienteId]/page,[clienteId]/medidas/nueva/page,actions}.ts
        inventario/{page,movimientos/page,actions}.ts
        gastos/{page,actions}.ts
        reportes/{page,financieros/page,operativos/page,clientes/page}.ts
        usuarios/{page,actions}.ts  # solo ADMIN
      api/
        auth/[...nextauth]/route.ts
        blob/upload/route.ts       # token de subida + onUploadCompleted
        export/[reporte]/route.ts  # CSV
    components/
      ui/  forms/  charts/
      uploads/PhotoUploadField.tsx
      medidas/MedidaEditor.tsx     # filas dinámicas nombre/valor/unidad
    lib/
      db.ts                       # singleton de Prisma
      auth.ts  auth-guards.ts      # requireSession(), requireRole()
      validation/*.schema.ts       # zod, uno por módulo
      services/
        prorrateo.ts  rentabilidad.ts  inventario-stock.ts  reportes.ts
      blob.ts  utils.ts
    middleware.ts
    types/next-auth.d.ts
  .env.local / .env.example
```

`lib/services/*` contiene lógica de negocio pura (sin depender de Next.js) para que sea testeable y reutilizable entre Server Actions, exportación CSV y el Dashboard.

---

## 2. Modelo de datos (Prisma)

**Auth**: `User(id, nombre, email único, passwordHash, role, activo)`. Sin tablas `Account`/`Session` — no se usan OAuth ni sesiones de BD.

**Cliente** (Módulo 5, único para todos los módulos): `id, tipo(PERSONA|EMPRESA), nombre, documento, telefono, whatsapp, correo, direccion, contactoNombre, contactoTelefono`. El "historial" (total gastado, última visita, servicios) NO se guarda como columna: se calcula con queries de agregación sobre las órdenes/servicios/pedidos del cliente.

**Producción por Lotes** (Módulo 2): `OrdenProduccion(id, numero, clienteId, fechaIngreso, fechaEntrega, estado, notas)` con relación a `ProductoOrden(id, ordenId, tipoPrenda, cantidad, valorUnitario, total)` (líneas de producto). La rentabilidad no es una tabla, es una vista calculada (ver sección 3).

**Clínica de Ropa** (Módulo 3): `ServicioClinica(id, clienteId, prendaTipo, prendaDescripcion, trabajoSolicitado, estado, fechaRecibido, fechaEntregaEstimada, valorCotizado, anticipo, saldoPendiente)` + `FotoServicio(id, servicioId, tipo(ANTES|DESPUES), url)` como relación (no columnas fijas), para soportar más de una foto por lado sin migraciones futuras.

**Confección Personalizada** (Módulo 4) — el reto de diseño principal:
- `PedidoConfeccion(id, clienteId, tipoPrenda, diseño, observaciones, fechaEntrega, precio, estado, medidaSnapshotId)`.
- `MedidaSnapshot(id, clienteId, fecha, notas)` = una "sesión de medición" fechada.
- `Medida(id, snapshotId, nombre, valor, unidad, orden)` = fila libre, sin columnas fijas — así se cumple el requisito de "no medidas fijas".
- `PlantillaMedida(id, tipoPrenda, nombre, unidadDefault, orden)` (opcional, recomendado): al elegir "tipo de prenda = Camisa" se pre-llenan las filas de medida típicas (cuello, pecho, cintura, manga, largo) como punto de partida editable — no como restricción del esquema.
- Comparar histórico = listar los `MedidaSnapshot` de un cliente por fecha, cada uno con su set completo de medidas.

**Inventario** (Módulo 6): `Insumo(id, nombre, unidad, costoUnitario, stockMinimo)` + `MovimientoInventario(id, insumoId, tipo(ENTRADA|SALIDA|AJUSTE), cantidad, costoUnitario, motivo, ordenId?, createdByUserId)` como ledger. El stock actual NUNCA se guarda como columna mutable: se calcula como `Σ cantidad` de los movimientos, así nunca se desincroniza.

**Gastos** (Módulo 7, compartida con "costos asociados" del Módulo 2): `Gasto(id, concepto, categoria, tipo(FIJO|VARIABLE), monto, fecha, ordenId?, servicioClinicaId?, notas, createdByUserId)`. Una orden de producción con `tipo=VARIABLE` y `ordenId` fijo ES el "costo asociado" del Módulo 2; un gasto con `tipo=FIJO` y `ordenId=null` ES el "gasto fijo mensual" del Módulo 7. Una sola tabla evita datos duplicados/contradictorios entre ambos módulos.

**Reportes** (Módulo 8): sin tablas nuevas, son queries de agregación en `lib/services/reportes.ts` sobre todo lo anterior.

---

## 3. Algoritmo de costos fijos prorrateados

**Recomendación: prorrateo por participación en ingresos del mes, calculado al vuelo.**

Para el mes `M`:
1. `totalFijosM` = suma de `Gasto` con `tipo=FIJO` y fecha en `M`.
2. `ordenesActivasM` = órdenes con `estado != CANCELADO` que se solapan con `M`.
3. `ingresoOrdenX` = suma de `ProductoOrden.total` de la orden `X`.
4. `costoIndirectoX = totalFijosM × (ingresoOrdenX / Σ ingresos de ordenesActivasM)`.

**Por qué por ingresos y no por cantidad de órdenes o días de producción**: dividir en partes iguales castigaría injustamente a una orden pequeña poniéndola al mismo nivel que una orden grande (que consume más energía/tiempo real); prorratear por días de producción sería más preciso pero exige registrar fechas de inicio/fin de producción que el PRD no pide capturar, y un taller pequeño difícmente lo mantendría exacto. Prorratear por ingresos usa datos que ya existen obligatoriamente (el total de la orden, necesario para facturar) y es fácil de explicar al dueño del negocio: "la orden más grande asume una porción más grande del arriendo y la luz de este mes".

No se guarda en caché: los gastos fijos del mes se pueden seguir registrando a mitad de mes (ej. la factura de luz llega el día 20), así que se recalcula cada vez que se consulta Rentabilidad/Reportes. Vive en `lib/services/prorrateo.ts` como función pura (testeable con datos de prueba, sin llamadas directas a Prisma).

---

## 4. Autenticación y roles

**Auth.js v5**, Credentials provider, sesión JWT, **sin** adapter de Prisma (no se usa OAuth ni sesiones en BD — cada conexión a BD evitada importa dado el límite de conexiones de HostGator). Hash de contraseñas con `bcryptjs` (evita fricción de módulos nativos en el build de Vercel).

Tres capas de control de acceso:
1. **Middleware de Edge** (`src/middleware.ts`): redirige a `/login` si no hay sesión, para todo lo que esté bajo `(dashboard)`.
2. **Guard a nivel de layout** para secciones restringidas (ej. `usuarios/`, `reportes/` solo ADMIN).
3. **Guard en cada Server Action**: `requireRole([...])` al inicio de toda acción que mute datos — esta es la capa que realmente importa, porque ocultar un botón en la UI no impide llamar la Server Action directamente.

Mapa de capacidades por rol (fuente de verdad para cada `requireRole`):

| Capacidad | ADMIN | OPERARIO | RECEPCIÓN |
|---|---|---|---|
| Ver dashboard/KPIs | sí | subset operativo | subset de recepción |
| Ver órdenes | sí | sí | sí |
| Actualizar estado de orden/servicio | sí | sí | no |
| Registrar cliente / crear orden / pedido / servicio | sí | no | sí |
| Entregar prenda | sí | no | sí |
| Inventario (movimientos) | sí | sí (salidas por consumo) | no |
| Gastos | sí | no | no |
| Reportes financieros | sí | no | no |
| Gestión de usuarios | sí | no | no |

---

## 5. Carga de fotos (Vercel Blob)

**Subida directa desde el navegador** (`@vercel/blob/client`), no a través de una Server Action — las funciones de Vercel tienen un límite de 4.5MB por request, y una foto de celular lo supera fácilmente.

Flujo: `app/api/blob/upload/route.ts` implementa `handleUpload`, valida sesión/rol en `onBeforeGenerateToken` antes de emitir el token (si no, cualquiera con la URL podría subir archivos), restringe tipos de archivo a imágenes y un tamaño máximo razonable. El componente `PhotoUploadField` sube el archivo y pasa la URL resultante a la Server Action del formulario, que la guarda como string en `FotoServicio.url`. Acceso público (`access: 'public'`) — son fotos de referencia de trabajo, no datos sensibles.

---

## 6. Riesgo: MySQL compartido de HostGator + funciones serverless de Vercel

Este es el mayor riesgo operativo del stack.

**Acceso remoto**: en cPanel → Remote MySQL hay que agregar `%` como host permitido, porque las funciones de Vercel no tienen IP fija (salvo addon de pago). Esto abre el puerto 3306 al público — se mitiga con una contraseña larga y un usuario de BD dedicado solo a la base de EU Moda (nunca el usuario maestro de cPanel), y usando SSL si HostGator lo soporta.

**Verificación bloqueante antes de empezar**: confirmar que el plan de hosting de HostGator realmente permite conexiones externas al puerto 3306 (algunos planes compartidos lo bloquean sin importar la configuración de cPanel). Esto se revisa primero, en la Fase 0, antes de cualquier otro trabajo.

**Pool de conexiones**: singleton de `PrismaClient` en `lib/db.ts`, con `connection_limit=3` y `pool_timeout=10` en el `DATABASE_URL` (no `1`, para no bloquear cuando una página dispara 2+ queries en paralelo). Nunca llamar `$disconnect()` en código de request (solo en scripts). Con un presupuesto de ~20-25 conexiones en hosting compartido, el techo realista es de unas 6-8 instancias serverless simultáneas sosteniendo conexión — aceptable para el tráfico interno de un taller pequeño, pero queda documentado como límite conocido.

**Plan B si hay agotamiento de conexiones en producción**: introducir un proxy/pooler liviano (ej. un contenedor pequeño en Railway/Fly.io corriendo ProxySQL) entre Vercel y HostGator. No se construye de entrada — se documenta como el siguiente paso si los logs muestran errores `Too many connections` o `P2024` de Prisma.

---

## 7. Orden de fases de construcción

- **Fase 0 — Fundación**: proyecto Next.js + repo + Vercel + dominio. Verificar acceso remoto a MySQL (bloqueante). Esquema `User`, Auth.js, middleware, seed de un ADMIN, shell de la app con nav por rol. Desplegar a Vercel y confirmar que conecta a HostGator en producción antes de seguir — esto valida el riesgo más grande del proyecto lo antes posible.
- **Fase 1 — Clientes**: CRUD completo de `Cliente`, buscador, ficha de cliente (historial queda vacío hasta que existan otros módulos). Se construye aquí el selector/autocompletar de cliente reutilizado por todos los módulos siguientes.
- **Fase 2 — Producción por Lotes**: `OrdenProduccion` + `ProductoOrden`, estados, tabla `Gasto` (introducida aquí, reutilizada en Fase 6) para "costos asociados", prorrateo y rentabilidad por orden.
- **Fase 3 — Clínica de Ropa**: `ServicioClinica` + `FotoServicio`. Aquí se construye la subida a Vercel Blob por primera vez (se reutiliza tal cual en módulos futuros que necesiten fotos).
- **Fase 4 — Confección Personalizada**: `PedidoConfeccion`, `MedidaSnapshot`, `Medida`, `PlantillaMedida`, y el componente `MedidaEditor` (filas dinámicas). Es la pieza de UI más particular del proyecto — la que más tiempo de implementación necesita.
- **Fase 5 — Inventario**: `Insumo` + `MovimientoInventario`, stock derivado, vínculo opcional de salidas con órdenes.
- **Fase 6 — Gastos**: UI completa sobre la tabla `Gasto` ya creada en Fase 2, enfocada en captura mensual de gastos fijos.
- **Fase 7 — Reportes**: funciones de agregación en `lib/services/reportes.ts` + pantallas con filtros de fecha + exportación CSV.
- **Fase 8 — Dashboard**: tarjetas de KPI y gráficas (recharts) como capa de presentación sobre las mismas funciones de Fase 7 — sin lógica de negocio nueva.

Este orden evita retrabajo: Cliente y Gasto/prorrateo se construyen antes de cualquier módulo que dependa de ellos, la subida de fotos se construye una sola vez, y Reportes/Dashboard se construyen al final como capas finas sobre datos ya estables.

---

## 8. Estrategia de verificación

- El entorno de desarrollo local conecta **directamente al MySQL remoto real de HostGator** (no un Docker local), usando una base separada `eumoda_dev` (distinta de `eumoda_prod` en la misma cuenta) — así el riesgo de conexión remota se observa desde el día 1, no se esconde detrás de un mock.
- Vercel Preview Deployments (uno por PR) apuntan a `eumoda_dev`; producción apunta a `eumoda_prod`.
- Checklist por fase: probar cada Server Action nueva desde la UI (crear/editar/listar), iniciar sesión como cada uno de los 3 roles y confirmar que la tabla de capacidades de la sección 4 se respeta tanto en la UI como al llamar la acción directamente, probar formularios con datos inválidos, y para módulos con fotos probar con una imagen de tamaño real de celular.
- Antes de cada despliegue a producción: revisar el diff de la migración de Prisma, confirmar variables de entorno en Vercel (`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `NEXTAUTH_SECRET`), y tras desplegar monitorear los logs de funciones de Vercel durante la primera hora buscando errores de conexión a MySQL (`Too many connections` / `P2024`) como señal concreta de que el riesgo de la sección 6 se está materializando.

---

## Archivos críticos a crear primero

- `prisma/schema.prisma`
- `src/lib/db.ts`
- `src/lib/auth.ts`, `src/lib/auth-guards.ts`
- `src/lib/services/prorrateo.ts`
- `src/app/api/blob/upload/route.ts`
- `src/components/medidas/MedidaEditor.tsx`
