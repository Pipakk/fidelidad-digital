insert into public.bars (name, slug, stamp_goal, reward_title, config)
values (
  'Bar La Esquina',
  'bar-la-esquina',
  8,
  'Caña gratis',
  '{
    "version": 1,
    "branding": {
      "name": "Bar La Esquina",
      "theme": {
        "background": "radial-gradient(1200px 600px at 20% 10%, rgba(255,186,73,.35), transparent 60%),radial-gradient(900px 500px at 90% 20%, rgba(52,211,153,.30), transparent 55%),radial-gradient(900px 500px at 30% 90%, rgba(248,113,113,.25), transparent 55%),linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
        "primary": "#34d399",
        "secondary": "#fde68a",
        "text": "#ffffff"
      }
    },
    "seo": {
      "title": "Bar La Esquina · Sellos y Ruleta",
      "description": "Consigue sellos y gira la ruleta para premios."
    },
    "features": {
      "wheel": true,
      "stamps": true,
      "wallet": true,
      "login": true,
      "admin": true
    },
    "stamps": {
      "goal": 8,
      "daily_limit": 1,
      "reward_title": "Caña gratis"
    },
    "rewards": {
      "expires_days": 30
    },
    "wheel": {
      "enabled": true,
      "cooldown_days": 7,
      "ui": {
        "segment_colors": ["#f59e0b", "#fde68a", "#34d399", "#fde68a", "#f87171", "#fde68a"]
      },
      "segments": [
        { "id": "stamp_1", "enabled": true, "label": "1 sello extra", "type": "stamp", "value": 1, "weight": 3 },
        { "id": "none_1", "enabled": true, "label": "Sigue jugando", "type": "none", "weight": 6 },
        { "id": "reward_1", "enabled": true, "label": "5% dto próxima visita", "type": "reward", "weight": 2 },
        { "id": "reward_2", "enabled": true, "label": "Tapa gratis", "type": "reward", "weight": 1 }
      ]
    },
    "texts": {
      "landing": {
        "subtitle": "Acumula sellos y gana premios. Sin apps, solo QR."
      }
    }
  }'::jsonb
)
on conflict (slug) do nothing;

-- PIN staff/admin: 1234 -> sha256 = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
insert into public.staff_users (bar_id, pin_hash, role)
select
  (select id from public.bars where slug='bar-la-esquina'),
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  'admin'
where not exists (
  select 1
  from public.staff_users su
  where su.bar_id = (select id from public.bars where slug='bar-la-esquina')
    and su.pin_hash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
);
