insert into public.bars (name, slug, stamp_goal, reward_title)
values ('Bar La Esquina', 'bar-la-esquina', 8, 'Caña gratis')
on conflict (slug) do nothing;

-- PIN staff: 1234 -> sha256 (généralo con Node y pégalo aquí)
-- insert into public.staff_users (bar_id, pin_hash)
-- values ((select id from public.bars where slug='bar-la-esquina'), '<HASH_SHA256>');
