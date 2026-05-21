# GestionAr Landing/Dashboard - Flujo QA y Produccion

## Flujo de ramas

- `main`: produccion objetivo. El repo local actualmente puede seguir en `master`; migrar Vercel a `main` cuando se confirme el cambio de rama productiva.
- `develop`: QA mediante Preview Deployment.
- `feature/<nombre>`: cambios nuevos desde `develop`.
- `hotfix/<nombre>`: correcciones urgentes desde la rama productiva.

## Ambientes Vercel

Produccion:

- Production Branch: `main` cuando se complete la migracion de rama.
- Variable `VITE_API_URL=https://consorcio-api-production.up.railway.app/api`.
- Dominio productivo apuntando al deployment de produccion.

QA:

- Preview Deployment desde `develop`.
- Variable Preview para branch `develop`: `VITE_API_URL=https://consorcio-api-qa.up.railway.app/api`.
- No usar credenciales ni API productiva en previews.

El proyecto es Vite, por eso la variable valida es `VITE_API_URL`. `REACT_APP_API_URL` no se usa.

## Flujo de trabajo

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-corto
npm run build
```

Para pasar a QA, abrir PR hacia `develop`. Para produccion, validar QA y abrir PR desde `develop` hacia `main`.

## Rollback

- Vercel: usar rollback al deployment productivo anterior o promover un deployment validado.
- Si hay hotfix, crear `hotfix/<nombre>` desde la rama productiva, validar, mergear a produccion y luego a `develop`.

## Variables

Usar `.env.production` y `.env.qa` como plantillas locales sin secretos. En Vercel, configurar variables desde Project Settings > Environment Variables y limitar el alcance a Production o Preview segun corresponda.

## Validacion

```bash
npm run build
```
