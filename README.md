# Loyalty MVP (Sellos + Ruleta) — Next.js + Supabase + SMS OTP

## Ejecutar local
1) Instala dependencias:
```bash
npm install
```

2) Crea un proyecto en Supabase y ejecuta:
- `supabase/schema.sql`
- (opcional) `supabase/seed.sql`

3) Activa Phone OTP (SMS) en Supabase y configura Twilio.

4) Crea `.env.local` copiando `.env.local.example` y rellena keys.

5) Arranca:
```bash
npm run dev
```
Abre: http://localhost:3000/b/bar-la-esquina
