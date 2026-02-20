# Loyalty Ruleta (MVP)

MVP web para bares/restaurantes basado en QR (sin app) con:
- **Fidelización por sellos** (wallet de sellos)
- **Gamificación por ruleta** (premios aleatorios)
- **Canje de premios por staff** mediante PIN
- Autenticación por **email + contraseña** (Supabase Auth)

---

## 0) Cómo ejecutar el proyecto

### Opción A: Supabase en la nube (recomendado para empezar)

1. **Crear un proyecto en [Supabase](https://supabase.com)**  
   Dashboard → New project → anota **Project URL** y **API Keys** (anon public + service_role).

2. **Variables de entorno**  
   En la raíz del repo crea `.env.local` (puedes copiar `.env.local.example`):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

   Sustituye por los valores de tu proyecto (Settings → API).

3. **Crear tablas y datos iniciales en Supabase**  
   En el Dashboard: **SQL Editor** → New query.  
   - Pega y ejecuta el contenido de `supabase/schema.sql`.  
   - Luego ejecuta `supabase/seed.sql` (bar de ejemplo + staff con PIN `1234`).

4. **Levantar Next.js**

   ```bash
   npm install
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000). Verás el selector de negocio; entra a **Bar La Esquina** (`/b/bar-la-esquina`).

---

### Opción B: Supabase local (Docker)

1. **Instalar [Supabase CLI](https://supabase.com/docs/guides/cli)** y tener Docker en marcha.

2. **Inicializar y arrancar Supabase en el repo**

   ```bash
   npx supabase init
   npx supabase start
   ```

   La CLI te mostrará **API URL**, **anon key** y **service_role key**. Cópialos.

3. **Aplicar schema y seed**

   ```bash
   npx supabase db reset
   ```

   Si el seed no se ejecuta por defecto, copia el contenido de `supabase/schema.sql` y `supabase/seed.sql` y ejecútalo en **Supabase Studio** (la URL local que muestra `supabase start`).

4. **Configurar `.env.local`** con la URL y las keys que mostró `supabase start`.

5. **Levantar el proyecto**

   ```bash
   npm install
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) → selector de negocio → `/b/bar-la-esquina`.

---

### Datos de prueba (seed)

- **Bar:** Bar La Esquina, slug `bar-la-esquina`.
- **Staff admin:** PIN `1234` (para añadir sellos y canjear premios en la wallet).
- Crea usuarios desde la app (registro con email/contraseña) en `/b/bar-la-esquina/login`.

---

## 1) ¿Qué hace la app?

El bar coloca un **QR**. El cliente lo escanea y abre la web del bar:

- Landing del bar: `/b/:slug`
- Login: `/b/:slug/login`
- Wallet (sellos + premios): `/b/:slug/wallet`
- Ruleta: `/b/:slug/spin`

### Flujo principal
1. Cliente entra por QR (landing del bar).
2. Se registra / inicia sesión (email + pass).
3. Ve su **wallet**:
   - Sellos acumulados (progreso hacia el premio por completar).
   - Premios activos obtenidos en ruleta o por sellos.
4. El camarero valida consumiciones:
   - introduce **PIN staff** para añadir sellos
5. Cliente puede girar la **ruleta**
   - Si gana, se crea un premio activo en su perfil.
6. Para **canjear premios**, staff introduce el PIN.

---

## 2) Stack / Tecnología

- **Next.js (App Router)** + React (Client Components)
- **Supabase**:
  - Auth (email/pass)
  - Postgres (tablas)
  - Storage (opcional: `bars.logo_url`)
- Confetti: `canvas-confetti`
- Sonido: Web Audio API (sin archivos)

---

## 3) Modelo de datos (Supabase)

> Nota: Todas las tablas están en esquema `public`.

### Diagrama conceptual (relaciones)
- **bars (1)** → **memberships (N)** (un bar tiene muchos clientes)
- **auth.users (1)** → **customers (1)** (perfil extendido opcional)
- **bars (1)** → **staff_users (N)** (PINs del staff por bar)
- **bars (1)** → **rewards (N)** (premios emitidos)
- **auth.users (1)** → **rewards (N)** (premios por cliente)
- **rewards (1)** → **wheel_spins (N)** (histórico de tiradas)
- **bars (1)** → **stamp_events (N)** (histórico de sellos añadidos)

---

## 4) Tablas y campos

### 4.1 `bars`
Bar/establecimiento (configuración general)

**Campos**
- `id` (uuid, PK)
- `name` (text)
- `slug` (text, unique) → usado en URL `/b/:slug`
- `logo_url` (text, nullable) → URL de imagen
- `stamp_goal` (int4) → sellos necesarios para completar
- `reward_title` (text) → premio por completar los sellos (ej. “Caña gratis”)
- `reward_expires_days` (int4) → días de caducidad del premio (wheel/stamps)
- `stamp_daily_limit` (int4) → límite de sellos por día (si se implementa)
- `wheel_enabled` (bool)
- `wheel_cooldown_days` (int4) → cooldown entre tiradas (si se implementa)
- `created_at` (timestamptz)

**Relaciones**
- `bars.id` → `memberships.bar_id`
- `bars.id` → `rewards.bar_id`
- `bars.id` → `staff_users.bar_id`
- `bars.id` → `wheel_spins.bar_id`
- `bars.id` → `stamp_events.bar_id`

---

### 4.2 `customers`
Perfil extendido (opcional). En este MVP se usa para guardar info adicional.

**Campos**
- `id` (uuid, PK) → **FK a `auth.users.id`**
- `phone` (text, nullable)
- `created_at` (timestamptz)

**Relación**
- `customers.id` → `auth.users.id`

---

### 4.3 `memberships`
Wallet de sellos por (bar, cliente)

**Campos**
- `id` (uuid, PK)
- `bar_id` (uuid, FK → `bars.id`)
- `customer_id` (uuid, FK → `auth.users.id`)
- `stamps_count` (int4) → sellos acumulados actuales
- `updated_at` (timestamptz)

**Relaciones**
- (`bar_id`, `customer_id`) identifica el wallet del cliente en ese bar

---

### 4.4 `staff_users`
Usuarios staff del bar (control por PIN)

**Campos**
- `id` (uuid, PK)
- `bar_id` (uuid, FK → `bars.id`)
- `pin_hash` (text) → sha256(pin)
- `role` (text, nullable) → ej. “staff”, “manager”
- `created_at` (timestamptz)

**Uso**
- Validar PIN al añadir sellos o canjear premios.

---

### 4.5 `rewards`
Premios emitidos al cliente

**Campos**
- `id` (uuid, PK)
- `bar_id` (uuid, FK → `bars.id`)
- `customer_id` (uuid, FK → `auth.users.id`)
- `source` (text) → `"wheel"` o `"stamps"` (u otro)
- `title` (text) → nombre visible del premio
- `status` (text) → `"active"` / `"redeemed"` / `"expired"`
- `expires_at` (timestamptz)
- `created_at` (timestamptz)

**Uso**
- La wallet lista solo `status = 'active'`.

---

### 4.6 `wheel_spins`
Histórico de tiradas de ruleta

**Campos**
- `id` (uuid, PK)
- `bar_id` (uuid, FK → `bars.id`)
- `customer_id` (uuid, FK → `auth.users.id`)
- `reward_id` (uuid, nullable FK → `rewards.id`)
- `created_at` (timestamptz)

**Uso**
- Registro de auditoría y soporte para cooldown.
- Si el resultado es “Sigue jugando”, `reward_id` puede ser `null`.

---

### 4.7 `stamp_events`
Histórico de sellos añadidos

**Campos**
- `id` (uuid, PK)
- `bar_id` (uuid, FK → `bars.id`)
- `customer_id` (uuid, FK → `auth.users.id`)
- `staff_id` (uuid, FK → `staff_users.id`)
- `created_at` (timestamptz)

**Uso**
- Auditoría y soporte para límites diarios.

---

## 5) Endpoints (API)

### `POST /api/spin`
Gira la ruleta y (si gana) crea un premio.

**Body**
```json
{ "barSlug": "bar-la-esquina", "customerId": "<auth.user.id>" }
