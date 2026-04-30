# CLAUDE.md - Landing Page Gestionar

## Estado Actual

Este proyecto es la landing web comercial y el dashboard web privado de Gestionar.

Gestionar es una plataforma para administracion de consorcios, barrios privados, loteos y organizaciones similares. La landing convive en el mismo workspace que:

- `../consorcio-api`: API REST existente.
- `../consorcio-app`: PWA/mobile administrativa y de propietarios.
- `../landing-page`: este proyecto React/Vite.

La landing y el dashboard usan los endpoints reales de `consorcio-api`. No se deben crear endpoints duplicados si ya existen.

## Stack

- React 19.
- Vite 7.
- TypeScript.
- CSS propio en `src/styles.css`.
- Iconos con `lucide-react`.
- Routing simple por `window.location.pathname` en `src/App.tsx`.

Scripts:

```bash
npm run dev
npm run build
npm run preview
```

## Variables De Entorno

La URL de la API se resuelve en `src/services/apiClient.ts` con este orden:

1. `VITE_API_URL`
2. `window.CONSORCIO_API_URL`
3. fallback productivo igual a la app mobile:

```env
https://consorcio-api-production.up.railway.app/api
```

`.env.example` debe quedar asi:

```env
VITE_API_URL=https://consorcio-api-production.up.railway.app/api
```

En Vercel, configurar:

```env
VITE_API_URL=https://consorcio-api-production.up.railway.app/api
```

para Production, Preview y Development.

## Estructura Actual

```text
src/
  App.tsx
  main.tsx
  styles.css
  services/
    apiClient.ts
    authService.ts
    adminService.ts
  pages/
    public/
      HomePage.tsx
    auth/
      LoginPage.tsx
    admin/
      AdminPreviewPage.tsx
```

Notas:

- `AdminPreviewPage.tsx` ya no es solo preview: contiene el dashboard web funcional.
- El nombre del archivo puede cambiarse mas adelante, pero hoy la ruta `/admin` lo usa directamente.
- `adminService.ts` centraliza los endpoints del panel admin.

## Rutas

Definidas en `src/App.tsx`:

- `/`: landing publica.
- `/login`: login administrativo.
- `/admin`: dashboard privado.

No hay React Router instalado. Mantener routing simple salvo que exista una razon clara para migrar.

## Landing Publica

Archivo principal:

```text
src/pages/public/HomePage.tsx
```

La landing incluye:

- Navegacion fija.
- Hero comercial.
- Mockup visual del dashboard.
- Beneficios.
- Modulos y servicios.
- Proceso.
- Planes.
- FAQ.
- Contacto.
- Footer.

Estetica actual:

- SaaS moderno.
- Fondo oscuro.
- Acento verde.
- Tipografias externas desde `index.html`.
- CSS propio, sin Tailwind.

## Login

Archivo:

```text
src/pages/auth/LoginPage.tsx
```

Endpoint:

```http
POST /auth/login
```

Token:

```text
localStorage.gestionar_token
```

El login soporta multi-organizacion:

- Si la API devuelve `requiresOrganizationSelection: true`, se muestra selector de organizacion.
- La seleccion usa:

```http
POST /auth/select-organization
```

- Se envia `selectionToken` como Bearer token.
- Luego se guarda el JWT final en `localStorage.gestionar_token`.

## API Client

Archivo:

```text
src/services/apiClient.ts
```

Responsabilidades:

- Resolver `API_URL`.
- Adjuntar `Authorization: Bearer <token>` en requests con `auth: true`.
- Manejar `FormData` sin forzar `Content-Type`.
- Parsear errores.
- Si recibe `401`, limpiar token y redirigir a `/login`.
- Exponer `apiBlob()` para descargas, por ejemplo liquidacion PDF.

No hacer `fetch` directo desde componentes cuando exista o pueda existir un metodo en servicios.

## Servicios

### `authService.ts`

Funciones actuales:

- `login(email, password)`
- `selectOrganization(membershipId, selectionToken)`

### `adminService.ts`

Centraliza endpoints del dashboard:

- `me`
- `owners`
- `units`
- `payments`
- `notices`
- `claims`
- `expenses`
- `providers`
- `reports`
- `votes`
- `visits`
- `spaces`
- `reservations`
- `support`
- `config`

Mantener este archivo como punto unico para llamadas del dashboard.

## Dashboard Web

Archivo:

```text
src/pages/admin/AdminPreviewPage.tsx
```

Ruta:

```text
/admin
```

Autenticacion:

- Si no existe `localStorage.gestionar_token`, redirige a `/login`.
- Las llamadas protegidas usan `adminApi`.

Navegacion actual:

- Inicio
- Finanzas
- Comunidad
- Operaciones
- Proveedores
- Soporte
- Configuracion

### Inicio

Incluye:

- Hero operativo.
- Metric cards.
- Recaudacion anual.
- Pagos pendientes.
- Propietarios.
- Reclamos abiertos.
- Grafico mensual simple.
- Pendientes criticos.

### Finanzas

Incluye:

- Indicadores del mes.
- Selector de anio y mes.
- Descarga de liquidacion de expensas PDF.
- Grilla de pagos.
- Aprobacion/rechazo de pagos.
- Envio manual de recordatorios.
- Registro de gastos.
- Grilla de gastos.
- Marcar gasto como pagado.
- Eliminar gasto.

### Comunidad

Incluye:

- Alta de propietario.
- Grilla de propietarios.
- Alta de comunicado.
- Grilla de comunicados.
- Grilla de reclamos.
- Cambiar reclamo a en progreso.
- Resolver reclamo con nota.

### Operaciones

Incluye:

- Crear votacion.
- Grilla de votaciones.
- Cerrar/eliminar votacion.
- Crear espacio comun.
- Grilla de espacios.
- Grilla de reservas.
- Aprobar/rechazar reservas.
- Grilla de visitas.
- Aprobar/rechazar visitas.
- Marcar ingreso/egreso de visitas.

### Proveedores

Incluye:

- Alta de proveedor.
- Grilla de proveedores.
- Eliminacion de proveedor.

### Soporte

Incluye:

- Grilla de tickets de soporte.
- Cambiar ticket a en progreso.
- Resolver ticket con respuesta.

### Configuracion

Incluye:

- Configuracion general de organizacion.
- Cuota mensual.
- Periodo actual.
- Dia de vencimiento.
- Recargos.
- Datos bancarios.
- Alta de unidad.
- Grilla de unidades.
- Eliminacion de unidad.

## Grillas

El dashboard tiene un componente reutilizable `Table` dentro de `AdminPreviewPage.tsx`.

Todas las grillas deben mantener:

- Skeleton loading durante carga de endpoints.
- Busqueda por texto.
- Filtros por modulo.
- Paginacion local.
- Selector de cantidad por pagina: `5`, `10`, `20`, `50`.
- Footer con total de registros filtrados.
- Estados vacios claros.

Filtros actuales:

- Pagos: estado, periodo actual.
- Gastos: estado, categoria.
- Propietarios: deuda.
- Comunicados: tipo.
- Reclamos: estado.
- Votaciones: estado.
- Espacios: aprobacion.
- Reservas: estado, fecha de hoy.
- Visitas: estado, fecha de hoy.
- Proveedores: servicio.
- Soporte: estado, prioridad.
- Unidades: asignacion.

Si se agregan nuevas grillas, usar el mismo componente y el mismo lenguaje visual.

## Skeleton Loading

Hay skeletons para:

- Metric cards.
- Grillas.
- Toolbar de grilla.
- Filas de tabla.
- Grafico mensual.
- Lista compacta de pendientes.

Los estilos estan en `src/styles.css`.

No volver al loader global como unica senial de carga. Preferir skeleton por panel o por grilla.

## Estilos

Archivo unico:

```text
src/styles.css
```

Mantener:

- Fondo oscuro.
- Superficies sobrias.
- Acento verde.
- Bordes suaves.
- Layout denso pero respirable para dashboard.
- Tablas legibles.
- Responsive para mobile/tablet/desktop.

Evitar:

- Agregar Tailwind si no es necesario.
- Paletas nuevas que rompan la identidad.
- Duplicar clases innecesariamente.
- Componentes visuales demasiado marketing dentro del dashboard.

## Endpoints Usados

Autenticacion:

- `POST /auth/login`
- `POST /auth/select-organization`
- `GET /auth/me`

Dashboard/admin:

- `GET /owners/stats`
- `GET /owners`
- `POST /owners`
- `DELETE /owners/:id`
- `GET /units`
- `POST /units`
- `DELETE /units/:id`
- `GET /payments/dashboard`
- `GET /payments`
- `PATCH /payments/:id/approve`
- `PATCH /payments/:id/reject`
- `POST /payments/send-reminders`
- `GET /notices`
- `POST /notices`
- `DELETE /notices/:id`
- `GET /claims`
- `PATCH /claims/:id/status`
- `GET /expenses`
- `POST /expenses`
- `PATCH /expenses/:id/paid`
- `DELETE /expenses/:id`
- `GET /providers`
- `POST /providers`
- `DELETE /providers/:id`
- `GET /reports/monthly-summary`
- `GET /reports/expensas-pdf`
- `GET /votes`
- `POST /votes`
- `PATCH /votes/:id/close`
- `DELETE /votes/:id`
- `GET /visits`
- `PATCH /visits/:id/status`
- `GET /spaces`
- `POST /spaces`
- `DELETE /spaces/:id`
- `GET /reservations`
- `PATCH /reservations/:id/status`
- `GET /support-tickets`
- `PATCH /support-tickets/:id`
- `GET /config`
- `PATCH /config`

Antes de cambiar payloads o nombres de campos, revisar los controladores/modelos de `../consorcio-api`.

## Reglas De Implementacion

1. No romper contratos de la API.
2. No duplicar endpoints.
3. No hacer fetch directo si corresponde agregar un metodo a `adminService.ts`.
4. Toda pantalla protegida debe validar token.
5. Todos los mensajes visibles deben estar en espanol simple.
6. No mostrar errores tecnicos crudos al usuario.
7. Mantener el dashboard responsive.
8. Mantener skeletons, filtros y paginacion en grillas.
9. Correr `npm run build` antes de cerrar cambios.
10. Subir cambios a git automaticamente al terminar.

## Git

Repositorio remoto:

```text
origin https://github.com/Diegosejas2019/gestionar-landing-page.git
```

Rama actual:

```text
master
```

Regla vigente indicada por el usuario:

- Despues de implementar y verificar, hacer commit y push automaticamente.

Flujo recomendado:

```bash
npm run build
git status --short
git add <archivos>
git commit -m "<mensaje>"
git push origin master
```

No revertir cambios del usuario. Si aparece trabajo ajeno en el arbol, revisarlo antes de tocarlo.

## Vercel

Archivo actual:

```text
vercel.json
```

Tiene rewrite SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

El proyecto local no tiene `.vercel/project.json` al momento de esta actualizacion. Si hace falta revisar variables remotas, primero linkear el proyecto o usar el panel de Vercel.

## Estado De Build

El build debe pasar con:

```bash
npm run build
```

Ultimo estado conocido:

- Build correcto despues de agregar dashboard, grillas, skeletons, filtros y fallback productivo de API.

## Pendientes Posibles

Mejoras futuras razonables:

- Separar `AdminPreviewPage.tsx` en componentes por modulo.
- Extraer `Table`, `Metric`, `Panel`, skeletons y filtros a `src/components/dashboard`.
- Paginacion server-side para grillas grandes.
- Filtros server-side cuando el volumen de datos crezca.
- Mejorar formularios con modales de edicion.
- Agregar tests de smoke para login/dashboard.
- Agregar proteccion mas formal de rutas si se incorpora un router.

## Resultado Esperado

La landing debe:

- Presentar comercialmente Gestionar.
- Captar potenciales clientes.
- Permitir login de administradores.
- Resolver seleccion multi-organizacion.
- Acceder a un dashboard web funcional.
- Usar los mismos endpoints que la app mobile/PWA.
- Mantener una experiencia moderna, responsive y consistente con la identidad visual actual.
