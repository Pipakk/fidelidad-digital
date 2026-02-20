# Desplegar loyalty-mvp en producción (web pública)

Opciones ordenadas por **coste** y **escalabilidad**, con Next.js 14 + Supabase.

---

## Resumen rápido

| Opción | Coste aprox. | Escalabilidad | Dificultad |
|--------|----------------|----------------|------------|
| **Vercel (Hobby)** | 0 € (límites) | Alta | Muy baja |
| **Railway** | ~5–20 €/mes | Alta | Baja |
| **Cloudflare Pages** | 0 € (tier free) | Muy alta | Media (adaptar si usas Node APIs) |
| **Render** | 0 € (free) o ~7 €/mes | Buena | Baja |
| **Coolify + VPS** | ~5 €/mes (VPS) | Depende del VPS | Alta |

---

## 1. Supabase (backend)

Tu app ya usa Supabase. Para producción:

1. **Proyecto de producción**  
   En [supabase.com](https://supabase.com) crea un proyecto (o usa el actual si es solo demo).

2. **Variables de entorno**  
   Necesitarás en el host donde despliegues la app:
   - `NEXT_PUBLIC_SUPABASE_URL` → URL del proyecto (Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key (Settings → API)

3. **SQL**  
   Ejecuta en el SQL Editor de Supabase el `schema.sql` y los seeds o inserts de negocio (ej. `docs/supabase-barberia-omar-bien-abdaljalil.sql`).

El **plan gratuito** de Supabase suele ser suficiente para empezar (500 MB DB, 2 GB transferencia/mes, etc.). Si crece, pasas a plan de pago.

---

## 2. Opciones más baratas y escalables

### A) Vercel (recomendado para empezar)

- **Coste:** plan Hobby = 0 € (uso personal/no comercial; para comercial, Pro ~20 €/mes).
- **Ventajas:** Cero config para Next.js, despliegue con Git, SSL, CDN, buen free tier.
- **Límites free:** ~100 GB transferencia/mes, 1M invocaciones serverless, 100 deploys/día.

**Pasos:**

1. Sube el repo a **GitHub** (o GitLab/Bitbucket).
2. Entra en [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. En **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Tu URL será `https://tu-proyecto.vercel.app`.

**Dominio propio:** en el proyecto → Settings → Domains → añade tu dominio.

---

### B) Railway

- **Coste:** ~5 €/mes (incluye créditos; consumo por uso).
- **Ventajas:** Contenedores, no solo serverless; buen equilibrio precio/control; despliegue desde GitHub.

**Pasos:**

1. [railway.app](https://railway.app) → Login con GitHub.
2. **New Project** → **Deploy from GitHub** → elige el repo.
3. Railway detecta Next.js. Añade variables de entorno (Supabase URL y anon key).
4. Deploy. Te asigna una URL pública; puedes añadir dominio propio.

---

### C) Render

- **Coste:** plan free (con limitaciones) o **Web Service** ~7 €/mes (sin “dormir”).
- **Ventajas:** Fácil, soporta Next.js, SSL incluido.

**Pasos:**

1. [render.com](https://render.com) → **New** → **Web Service**.
2. Conecta el repo de GitHub.
3. Build command: `npm install && npm run build`.  
   Start command: `npm start`.
4. Añade las variables de entorno de Supabase.
5. Deploy.

---

### D) Cloudflare Pages (con adaptador Next.js)

- **Coste:** tier free muy generoso; Workers/Pages de pago si creces.
- **Ventajas:** CDN global, escalable, buen free tier.
- **Nota:** Next.js en Cloudflare suele usar `@cloudflare/next-on-pages` o similar; algunas APIs de Node pueden requerir ajustes.

Si quieres esta opción, se puede añadir al proyecto el adaptador y un apartado específico en esta guía.

---

### E) Self-hosted (VPS + Coolify o Docker)

- **Coste:** ~5 €/mes (VPS en Hetzner, Hostinger, etc.) + tu tiempo.
- **Ventajas:** Control total, coste fijo, sin límites de “invocaciones”.
- **Inconvenientes:** Tú mantienes servidor, actualizaciones y backups.

**Idea general:**

- VPS con Docker (o Coolify para UI de despliegue).
- Build: `docker build -t loyalty-mvp .` (necesitas un `Dockerfile` para Next.js).
- Run: exponer puerto 3000 y poner delante un proxy reverso (Nginx/Caddy) con SSL (Let’s Encrypt).

Si quieres, el siguiente paso puede ser añadir un `Dockerfile` y un ejemplo de `docker-compose` o de Caddy en este repo.

---

## 3. Checklist antes de ir a producción

- [ ] Variables de entorno en el host: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Supabase: schema y datos (bars, staff_users, etc.) cargados en el proyecto correcto.
- [ ] En producción no uses el mismo proyecto/keys que en desarrollo (o al menos no compartas keys de servicio).
- [ ] Dominio (opcional): configurar en Vercel/Railway/Render y, si aplica, DNS (A/CNAME) según su documentación.

---

## 4. Recomendación práctica

- **Empezar / MVP / bajo tráfico:** **Vercel (Hobby)** o **Render (free)** + Supabase free. Coste 0 € y escalable hasta que el uso lo pida.
- **Cuando haya tráfico o uso comercial:** **Vercel Pro** o **Railway** + Supabase (plan que toque según DB y ancho de banda).
- **Si prefieres coste fijo y control:** **Railway** o **VPS + Coolify/Docker**.

Si indicas qué opción quieres (Vercel, Railway, Render o VPS), se puede detallar aquí los pasos exactos y, si hace falta, un `Dockerfile` o script de deploy.
