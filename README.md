# Gestionar — Landing Web

Landing comercial y base de panel web para administradores de Gestionar.

## Stack

- React
- Vite
- TypeScript
- CSS propio
- API REST existente mediante `VITE_API_URL`

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Por defecto Vite levanta:

```text
http://localhost:5173
```

## Variables

Crear `.env` a partir de `.env.example`:

```text
VITE_API_URL=http://localhost:3000/api
```

## Rutas iniciales

- `/`: landing comercial.
- `/login`: login de administradores contra `POST /auth/login`.
- `/admin`: base visual del panel privado.

## Fuente del diseno

El HTML original recibido queda guardado como `design-source.html` para referencia visual. Los assets originales estan en `public/uploads/`.
