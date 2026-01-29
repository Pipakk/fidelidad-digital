# PARAMETRIZATION_REPORT

Fecha: 2026-01-29  
Objetivo: Refactor “loyalty-mvp” para ser **100% parametrizable por negocio (multi-tenant)** usando `bars.config` (jsonb) con validación runtime (Zod), defaults seguros y compatibilidad hacia atrás.

---

## Changelog incremental (durante el trabajo)

### 2026-01-29
- Añadido esquema runtime `zod` y tipos inferidos (`lib/CONFIG_SCHEMA.ts`).
- Añadido `ConfigService` con caching y fallback a columnas legacy (`lib/config/ConfigService.ts`).
- Añadidos endpoints:
  - `GET /api/business-config?slug=...` (config público por negocio)
  - `POST/PUT /api/admin/config` (leer/guardar config con PIN admin/manager)
- Añadida UI admin: `app/b/[slug]/admin/page.tsx` (editor JSON + validación).
- Refactor UI (sin hardcode salvo fallback) para consumir `cfg.texts/*` + `cfg.branding/*`:
  - `app/b/[slug]/page.tsx`
  - `app/b/[slug]/login/page.tsx`
  - `app/b/[slug]/wallet/page.tsx`
  - `app/b/[slug]/spin/page.tsx`
  - `app/s/[slug]/page.tsx`
- Refactor API para reglas por negocio (sin constantes hardcode salvo fallback seguro):
  - `app/api/spin/route.ts` (segments/pesos/cooldown)
  - `app/api/stamp/add/route.ts` (goal/daily_limit/expires/title)
  - `app/api/redeem/route.ts` (mensajes por config)
- SEO por negocio con `generateMetadata`: `app/b/[slug]/layout.tsx`.
- Debug verificación mínima (runtime): `GET /api/_debug/verify-config`.
- Actualizado SQL:
  - `supabase/schema.sql` (columna `bars.config`, `updated_at`, trigger, RLS/policies, wheel_spins audit cols)
  - `supabase/seed.sql` (negocio ejemplo con config completa + staff admin)
  - `supabase/patch.sql` (alter/migración incremental + RLS/policies)

---

## Tabla de cambios (archivo → cambio → motivo)

| Archivo | Cambio | Motivo |
|---|---|---|
| `lib/CONFIG_SCHEMA.ts` | Nuevo schema Zod + tipos + defaults | Validación runtime fuerte + defaults seguros |
| `lib/config/defaultConfig.ts` | Defaults centralizados | Unificar fallbacks en un único lugar |
| `lib/config/ConfigService.ts` | Servicio central: getBusinessBySlug/getConfig + caching + fallback legacy | Eliminar hardcode y soportar multi-tenant sin romper compatibilidad |
| `app/api/business-config/route.ts` | Endpoint público de config | Consumir config desde Client Components sin exponer claves |
| `app/api/admin/config/route.ts` | Endpoint admin (PIN/rol) para leer/guardar config | Admin UI segura sin service role en cliente |
| `app/b/[slug]/admin/page.tsx` | Pantalla admin por negocio | Edición de config (UI + editor JSON) |
| `app/b/[slug]/layout.tsx` | `generateMetadata` por negocio | SEO parametrizable por negocio |
| `supabase/patch.sql` | Alter + trigger + RLS/policies | Migración incremental para entornos existentes |
| `supabase/schema.sql` | Esquema actualizado | Fuente de verdad del modelo BD |
| `supabase/seed.sql` | Seed con negocio+config | Ejemplo completo multi-tenant |
| `app/api/spin/route.ts` | Ruleta por `cfg.wheel.*` + pesos + cooldown | Quitar hardcode y soportar N segmentos |
| `app/api/stamp/add/route.ts` | Sellos por `cfg.stamps.*` + expiración | Quitar hardcode y soportar reglas por negocio |
| `app/api/redeem/route.ts` | Mensajes por `cfg.texts.api` | Quitar hardcode de literales API |
| `lib/client/useBusinessConfig.ts` | Hook cliente | Cargar config por slug desde BBDD |
| `app/b/[slug]/*` | UI parametrizada | Literales/títulos/CTAs por negocio |
| `app/api/_debug/verify-config/route.ts` | Verificación mínima | “Test” runtime accesible en dev |

---

## Esquema JSON de configuración (documentado)

Fuente de verdad: `lib/CONFIG_SCHEMA.ts` (`BusinessConfigSchema`).

### Estructura (alto nivel)
- `version` (number)
- `branding`
  - `name`, `logo_url`, `favicon_url`
  - `theme`: `background`, `primary`, `secondary`, `text`
- `seo`
  - `title`, `description`
- `features`
  - `wheel`, `stamps`, `wallet`, `login`, `admin`
- `stamps`
  - `goal` (default **8**)
  - `daily_limit` (default **1**)
  - `reward_title` (fallback a `bars.reward_title` si existe)
- `rewards`
  - `expires_days` (default **30**)
- `wheel`
  - `enabled` (default **true**)
  - `cooldown_days` (default **7**)
  - `segments` (min 4; weighted)
    - `id`, `enabled`, `label`, `type` (`none|reward|stamp`), `value?`, `weight`, `metadata?`
  - `ui.segment_colors?` (opcional)
- `texts`
  - `common`, `landing`, `login`, `wallet`, `wheel`, `api`

### Defaults requeridos (cumplidos)
- `stamps.goal = 8`
- `stamps.daily_limit = 1`
- `rewards.expires_days = 30`
- `wheel.enabled = true`
- `wheel.cooldown_days = 7`
- `wheel.segments` incluye **≥ 4** segmentos con weights válidos

---

## Ejemplo completo por negocio (seed)

Ver `supabase/seed.sql` (negocio `bar-la-esquina`) con `bars.config` completo.

---

## Cómo añadir un nuevo negocio

1) Insertar fila en `public.bars` con `slug` único y `name`.
2) Añadir `config` (jsonb) con la estructura del schema.
3) (Opcional) Crear usuario staff con `role = 'admin'` o `'manager'` y `pin_hash = sha256(pin)`.
4) Acceder a:
   - Landing: `/b/<slug>`
   - Admin: `/b/<slug>/admin`

---

## Cómo funciona la Admin UI

- Ruta: `/b/:slug/admin`
- Flujo:
  - Introducir PIN admin.
  - Cargar config via `POST /api/admin/config`.
  - Editar JSON (editor avanzado).
  - Guardar via `PUT /api/admin/config`:
    - Validación fuerte con Zod
    - Si inválido → 422 + lista de issues

---

## Seguridad / RLS (resumen)

- `staff_users` no se expone en cliente; la validación de PIN se hace server-side con `SUPABASE_SERVICE_ROLE_KEY`.
- `supabase/patch.sql` habilita RLS y añade políticas mínimas para:
  - Leer `bars` (público)
  - Leer/crear/editar `customers` solo del propio usuario
  - Leer `memberships` y `rewards` solo del propio usuario

---

## Riesgos / compatibilidad / cómo probar

### Compatibilidad hacia atrás
- `ConfigService` hace fallback desde columnas legacy de `bars` hacia `cfg.*` si `config` falta o es inválido.
- Rutas existentes `/b/:slug/*` no se rompen; se añade `/b/:slug/admin`.

### Pruebas manuales recomendadas
- Negocio con `config = {}` → usa defaults (goal=8, wheel enabled, segments default).
- `wheel.segments` con N segmentos → se renderiza y se resuelve por peso (cuando se aplique en API).
- PIN admin incorrecto → 401.
- PIN correcto pero rol no admin/manager → 403.
- `GET /api/_debug/verify-config` → devuelve `ok: true` si pasan checks de schema/defaults.

---

## Migración / despliegue

3) Instrucciones para ejecutar migración y probar local
Instalar deps:
npm install
Migración (DB nueva):
Ejecuta supabase/schema.sql
Ejecuta supabase/seed.sql
Migración (DB existente):
Ejecuta supabase/patch.sql
(Opcional) Ejecuta supabase/seed.sql si quieres el negocio ejemplo
Variables de entorno (.env.local):
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
Arrancar:
npm run dev
Probar:
Landing: /b/bar-la-esquina
Login: /b/bar-la-esquina/login
Wallet: /b/bar-la-esquina/wallet
Ruleta: /b/bar-la-esquina/spin
Admin: /b/bar-la-esquina/admin (PIN: 1234)
Verificación schema/defaults: GET /api/_debug/verify-config

