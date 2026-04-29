# CLAUDE.md — Landing Web Comercial Gestionar

## Contexto general

Este proyecto corresponde a la landing web comercial de la app Gestionar.

Gestionar es una plataforma para administración de consorcios, barrios privados, loteos y organizaciones similares. Ya existe una API backend y una app PWA administrativa/propietarios. Esta landing debe convivir en el mismo workspace, pero como proyecto separado.

Estructura esperada del workspace:

/api
/admin-pwa
/landing-web

La landing debe usar los mismos endpoints existentes de la API. No se deben crear endpoints duplicados si ya existen.

---

## Objetivo del proyecto

Construir una landing web moderna, comercial y profesional para vender la app Gestionar.

Debe incluir:

- Página pública comercial.
- Secciones de beneficios.
- Explicación de módulos.
- Captación de potenciales clientes.
- Login para administradores.
- Panel web visualmente más “sitio web / SaaS” que la PWA actual.
- Reutilización de endpoints existentes.
- Experiencia responsive para desktop, tablet y mobile.

---

## Diferencia con la app PWA actual

La PWA actual está pensada para el uso operativo diario.

Esta landing debe tener una estética más comercial, institucional y moderna.

No copiar directamente el diseño de la PWA.

Debe sentirse como una web SaaS:

- Hero claro.
- Call to action visible.
- Secciones de confianza.
- Cards de funcionalidades.
- Capturas/mockups.
- Diseño limpio.
- Buen uso de espacios.
- Tipografía profesional.
- Dashboard web más amplio y visual.

---

## Stack esperado

Usar el stack actual del proyecto si ya está definido.

Preferentemente:

- React / Vite o Next.js según corresponda.
- TypeScript si el proyecto lo permite.
- Tailwind CSS si ya está disponible o es conveniente.
- React Router o routing propio del framework.
- Fetch/Axios usando un apiClient centralizado.
- Componentes reutilizables.

No agregar librerías innecesarias.

Antes de instalar dependencias nuevas, revisar si ya existe una alternativa en el proyecto.

---

## Reglas generales

1. No romper la API existente.
2. No modificar contratos de endpoints sin revisar impacto en la PWA actual.
3. No duplicar lógica innecesariamente.
4. No hardcodear URLs de producción.
5. Usar variables de entorno.
6. Mantener separación clara entre landing pública y panel privado.
7. Toda pantalla protegida debe validar autenticación.
8. Los errores deben mostrarse en español y con mensajes entendibles para usuarios no técnicos.
9. El código debe ser simple, mantenible y fácil de extender.
10. Mantener consistencia visual en toda la landing.

---

## Variables de entorno

Usar una variable para la URL de la API:

VITE_API_URL=https://tu-api.com/api

o equivalente según el framework.

Nunca hardcodear:

https://consorcio-api-production.up.railway.app

dentro de componentes.

---

## Estructura sugerida

src/
  components/
    layout/
    ui/
    marketing/
    dashboard/
  pages/
    public/
      HomePage.tsx
      PricingPage.tsx
      ContactPage.tsx
      FeaturesPage.tsx
    auth/
      LoginPage.tsx
    admin/
      AdminDashboardPage.tsx
      OwnersPage.tsx
      ExpensesPage.tsx
      PaymentsPage.tsx
      ClaimsPage.tsx
      NoticesPage.tsx
      SettingsPage.tsx
  services/
    apiClient.ts
    authService.ts
    ownerService.ts
    expenseService.ts
    paymentService.ts
    claimService.ts
    noticeService.ts
  hooks/
  context/
  types/
  utils/
  routes/

---

## Landing pública

La landing debe incluir como mínimo:

### Home

Secciones:

1. Header
   - Logo / nombre Gestionar
   - Inicio
   - Funcionalidades
   - Precios
   - Contacto
   - Ingresar

2. Hero
   - Título claro
   - Subtítulo comercial
   - CTA principal: “Solicitar demo”
   - CTA secundario: “Ingresar”
   - Mockup visual del dashboard

3. Problema
   - Administración manual
   - Cobros desordenados
   - Reclamos sin seguimiento
   - Falta de comunicación con propietarios

4. Solución
   - Gestionar centraliza administración, pagos, avisos, reclamos y propietarios.

5. Módulos principales
   - Propietarios
   - Expensas
   - Pagos
   - Gastos
   - Reclamos
   - Avisos
   - Reservas de espacios comunes
   - Visitas
   - Votaciones
   - Configuración por organización

6. Beneficios
   - Menos trabajo administrativo
   - Mayor transparencia
   - Mejor comunicación
   - Control de morosidad
   - Información centralizada
   - Acceso desde cualquier dispositivo

7. CTA final
   - “Digitalizá la administración de tu consorcio”

8. Footer
   - Contacto
   - Términos
   - Privacidad
   - Redes si aplica

---

## Login de administradores

Debe existir una pantalla `/login`.

Debe usar el endpoint actual:

POST /auth/login

Considerar el caso multi-organización.

Si el login responde:

requiresOrganizationSelection: true

debe mostrarse una pantalla/modal para seleccionar organización usando el selectionToken.

No pisar contraseña si el usuario ya existe.

El flujo debe respetar el comportamiento actual de la PWA.

---

## Panel privado web

Luego del login, el administrador debe acceder a un panel web con los mismos módulos principales de la app.

Ruta sugerida:

/admin

Módulos mínimos:

- Dashboard
- Propietarios
- Pagos
- Gastos
- Reclamos
- Avisos
- Configuración

Visualmente debe ser más amplio y moderno que la PWA:

- Sidebar en desktop.
- Header superior.
- Cards con métricas.
- Tablas limpias.
- Estados vacíos bien diseñados.
- Filtros claros.
- Acciones principales visibles.

No es necesario implementar toda la funcionalidad avanzada en la primera etapa, pero sí dejar la estructura preparada.

---

## Autenticación

Guardar token de forma consistente con el front actual si corresponde.

El apiClient debe adjuntar automáticamente:

Authorization: Bearer TOKEN

en requests protegidos.

Si la API responde 401:

- limpiar sesión
- redirigir a `/login`
- mostrar mensaje claro

---

## Multi-organización

El sistema soporta usuarios administradores asociados a más de una organización.

Reglas:

- Si el login devuelve una sola organización, ingresar directamente.
- Si devuelve varias organizaciones, pedir selección.
- Guardar organización activa.
- Todos los requests que dependan de organización deben usar el mecanismo actual del backend.
- No mezclar datos entre organizaciones.

---

## Diseño visual

Estilo sugerido:

- SaaS moderno.
- Profesional.
- Limpio.
- Con colores sobrios.
- Buena jerarquía visual.
- Cards con bordes suaves.
- Botones claros.
- Responsive.
- Animaciones sutiles, no excesivas.

Evitar:

- Pantallas saturadas.
- Colores demasiado fuertes.
- Copiar exactamente la PWA.
- Componentes sin espaciado.
- Textos genéricos sin valor comercial.

---

## Tono de textos

Los textos deben estar en español.

Orientado a administradores de:

- Consorcios
- Barrios privados
- Loteos
- Complejos
- Administraciones pequeñas y medianas

Usar lenguaje claro, comercial y directo.

Ejemplos:

“Administrá propietarios, pagos, reclamos y avisos desde un solo lugar.”

“Digitalizá la gestión de tu consorcio sin complicaciones.”

“Más control, menos trabajo manual.”

---

## Módulos del producto

Tener en cuenta que Gestionar puede incluir:

- Alta de organizaciones
- Administradores por organización
- Propietarios
- Períodos de pago
- Expensas ordinarias
- Gastos extraordinarios
- Pagos con comprobante
- Recibos generados por la app
- Envío de correos
- Avisos
- Reclamos
- Archivos adjuntos
- Morosidad
- Reservas de espacios comunes
- Registro de visitas
- Votaciones
- Configuración de módulos visibles
- WhatsApp como posible integración futura
- Notificaciones push como posible integración futura

No prometer funcionalidades que todavía no estén implementadas como si estuvieran productivas. Si se muestran, usar textos como:

“Próximamente”
“Disponible según configuración”
“Funcionalidad opcional”

---

## API

Crear servicios separados por dominio.

Ejemplo:

authService.login()
ownerService.getOwners()
paymentService.getPayments()
expenseService.getExpenses()
claimService.getClaims()
noticeService.getNotices()

No hacer fetch directamente desde los componentes salvo casos mínimos.

Centralizar manejo de errores.

---

## Manejo de errores

Todos los errores visibles para el usuario deben estar en español.

Ejemplos:

- “No pudimos iniciar sesión. Revisá tu correo y contraseña.”
- “No se pudieron cargar los propietarios.”
- “Ocurrió un error inesperado. Intentá nuevamente.”
- “Tu sesión expiró. Volvé a iniciar sesión.”

No mostrar errores técnicos crudos como:

- CastError
- MongoError
- 500 Internal Server Error
- undefined is not a function

---

## Responsive

La landing debe verse bien en:

- Mobile
- Tablet
- Desktop

El panel admin debe:

- Usar sidebar en desktop.
- Usar menú hamburguesa o navegación inferior en mobile.
- Mantener tablas legibles.
- Evitar scroll horizontal innecesario.

---

## SEO básico

Implementar:

- title
- meta description
- headings correctos
- textos claros
- estructura semántica

Ejemplo:

Title:
Gestionar | Software para administración de consorcios

Description:
Gestionar centraliza propietarios, pagos, reclamos, avisos y expensas en una plataforma simple para administraciones y consorcios.

---

## Seguridad frontend

No guardar datos sensibles innecesarios.

No exponer secretos en variables públicas.

No confiar solo en validaciones frontend.

Toda acción protegida depende del backend.

---

## Criterio de implementación

Trabajar por etapas.

### Etapa 1

- Crear estructura base.
- Landing Home.
- Login.
- apiClient.
- Auth context.
- Rutas públicas/protegidas.
- Layout admin.

### Etapa 2

- Dashboard admin.
- Listados iniciales.
- Integración con endpoints reales.

### Etapa 3

- Mejoras visuales.
- Estados vacíos.
- Loading states.
- Manejo robusto de errores.

### Etapa 4

- Contacto / demo.
- SEO.
- Optimización responsive.

---

## Antes de modificar

Antes de cambiar código existente:

1. Revisar estructura actual.
2. Identificar framework usado.
3. Revisar cómo se manejan rutas.
4. Revisar variables de entorno.
5. Revisar endpoints existentes.
6. No asumir nombres de campos sin verificar.
7. Mantener compatibilidad con la API.

---

## Resultado esperado

Una landing comercial moderna para Gestionar, separada de la PWA, pero integrada con la misma API.

Debe permitir:

- Presentar comercialmente el producto.
- Captar clientes.
- Iniciar sesión como administrador.
- Acceder a un panel web con los módulos principales.
- Mantener coherencia con el sistema existente sin romperlo.