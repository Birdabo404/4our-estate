-- 4OUR Estate schema. Sold listings stay publicly readable.
-- A closed sale is part of the record guests can open by slug.
-- The catalog query still asks for status = published.

create type public.app_role as enum ('buyer', 'agent', 'admin');
create type public.listing_type as enum ('sale', 'rent');
create type public.property_type as enum (
  'house',
  'condominium',
  'townhouse',
  'villa',
  'penthouse',
  'lot'
);
create type public.listing_status as enum (
  'draft',
  'pending',
  'published',
  'sold',
  'archived'
);
create type public.inquiry_status as enum ('new', 'contacted', 'closed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'buyer',
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text check (phone is null or char_length(phone) between 8 and 32),
  avatar_url text check (avatar_url is null or char_length(avatar_url) between 1 and 500),
  agency text check (agency is null or char_length(agency) between 1 and 120),
  license_no text check (license_no is null or char_length(license_no) between 1 and 40),
  bio text check (bio is null or char_length(bio) between 1 and 800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mirrors src/lib/domain/types.ts LISTING_TRANSITIONS. Ownership stays in RLS.
create table public.listing_transition_rules (
  from_status public.listing_status not null,
  to_status public.listing_status not null,
  allowed_roles public.app_role[] not null,
  primary key (from_status, to_status),
  check (from_status <> to_status),
  check (cardinality(allowed_roles) > 0)
);

insert into public.listing_transition_rules (from_status, to_status, allowed_roles)
values
  ('draft', 'pending', array['agent', 'admin']::public.app_role[]),
  ('draft', 'archived', array['agent', 'admin']::public.app_role[]),
  ('pending', 'published', array['admin']::public.app_role[]),
  ('pending', 'draft', array['agent', 'admin']::public.app_role[]),
  ('published', 'sold', array['agent', 'admin']::public.app_role[]),
  ('published', 'archived', array['agent', 'admin']::public.app_role[]),
  ('sold', 'archived', array['agent', 'admin']::public.app_role[]),
  ('archived', 'draft', array['agent', 'admin']::public.app_role[]);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  agent_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 4 and 140),
  description text not null check (char_length(description) between 1 and 8000),
  listing_type public.listing_type not null,
  property_type public.property_type not null,
  status public.listing_status not null default 'draft',
  price_php bigint not null check (price_php > 0),
  bedrooms integer not null check (bedrooms between 0 and 30),
  bathrooms numeric(4, 1) not null check (bathrooms >= 0 and bathrooms <= 30),
  floor_area_sqm numeric(10, 2) not null check (floor_area_sqm >= 0),
  lot_area_sqm numeric(12, 2) check (lot_area_sqm is null or lot_area_sqm > 0),
  parking_slots integer not null default 0 check (parking_slots between 0 and 40),
  neighborhood text not null check (char_length(neighborhood) between 1 and 80),
  city text not null check (char_length(city) between 1 and 80),
  province text not null check (char_length(province) between 1 and 80),
  address text not null check (char_length(address) between 1 and 200),
  latitude numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  amenities text[] not null default '{}',
  year_built integer check (year_built is null or year_built between 1800 and 2100),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(neighborhood, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(city, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(province, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored
);

create index properties_search_idx on public.properties using gin (search);
create index properties_status_city_idx on public.properties (status, city);
create index properties_price_php_idx on public.properties (price_php);
create index properties_published_at_idx on public.properties (published_at desc);
create index properties_agent_id_idx on public.properties (agent_id);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null check (char_length(url) between 1 and 800),
  storage_path text check (storage_path is null or char_length(storage_path) between 1 and 400),
  alt text not null check (char_length(alt) between 1 and 300),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (property_id, position)
);

create index property_images_property_id_idx on public.property_images (property_id);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index favorites_property_id_idx on public.favorites (property_id);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  buyer_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (
    char_length(email) between 6 and 160
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  phone text check (phone is null or char_length(phone) between 8 and 32),
  message text not null check (char_length(message) between 20 and 2000),
  preferred_viewing_date date,
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

create index inquiries_property_id_idx on public.inquiries (property_id);
create index inquiries_buyer_id_idx on public.inquiries (buyer_id);
create index inquiries_email_created_idx on public.inquiries (lower(email), created_at desc);

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

-- Signup metadata may name buyer or agent. Anything else, including admin, becomes buyer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text;
  assigned public.app_role;
  given_name text;
begin
  requested := new.raw_user_meta_data ->> 'role';
  if requested = 'agent' then
    assigned := 'agent';
  else
    assigned := 'buyer';
  end if;

  given_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if given_name is null then
    given_name := 'Member';
  end if;

  insert into public.profiles (id, role, full_name, phone, agency)
  values (
    new.id,
    assigned,
    given_name,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'agency', '')), '')
  );
  return new;
end;
$$;

-- Service role bypasses this so the seed can appoint the admin.
-- A signed-in session cannot. The last admin cannot be removed.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_admins integer;
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.is_admin() then
    raise exception 'only admins can change roles' using errcode = 'P0001';
  end if;

  if old.role = 'admin' and new.role is distinct from 'admin' then
    select count(*)
    into remaining_admins
    from public.profiles
    where role = 'admin'
      and id <> old.id;
    if remaining_admins = 0 then
      raise exception 'cannot remove the last admin' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- Service role skips the machine so scripts/seed.ts can insert finished rows.
-- Every other session starts at draft and walks listing_transition_rules.
create or replace function public.enforce_listing_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.app_role;
  allowed boolean;
begin
  if auth.role() = 'service_role' then
    if new.status = 'published' and new.published_at is null then
      new.published_at := pg_catalog.now();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'new listings start as draft' using errcode = 'P0001';
    end if;
    if new.featured and not public.is_admin() then
      raise exception 'only admins may feature a listing' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if new.agent_id is distinct from old.agent_id and not public.is_admin() then
    raise exception 'agents cannot reassign a listing' using errcode = 'P0001';
  end if;

  if new.featured is distinct from old.featured and not public.is_admin() then
    raise exception 'only admins may feature a listing' using errcode = 'P0001';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  actor := public.current_app_role();
  select exists (
    select 1
    from public.listing_transition_rules as rules
    where rules.from_status = old.status
      and rules.to_status = new.status
      and actor = any (rules.allowed_roles)
  )
  into allowed;

  if not coalesce(allowed, false) then
    raise exception 'listing transition not allowed' using errcode = 'P0001';
  end if;

  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := coalesce(old.published_at, pg_catalog.now());
  end if;

  return new;
end;
$$;

-- Counts every row for the email, including rows RLS would hide from the sender.
create or replace function public.enforce_inquiry_throttle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(lower(new.email))::bigint);

  select count(*)
  into recent_count
  from public.inquiries
  where lower(email) = lower(new.email)
    and created_at > pg_catalog.now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'inquiry rate limit exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.restrict_inquiry_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.property_id is distinct from old.property_id
    or new.buyer_id is distinct from old.buyer_id
    or new.name is distinct from old.name
    or new.email is distinct from old.email
    or new.phone is distinct from old.phone
    or new.message is distinct from old.message
    or new.preferred_viewing_date is distinct from old.preferred_viewing_date
    or new.created_at is distinct from old.created_at
  then
    raise exception 'only inquiry status can be updated' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.set_cover_image(target_image uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  pid uuid;
begin
  select property_id
  into pid
  from public.property_images
  where id = target_image;

  if pid is null then
    raise exception 'image not found' using errcode = 'P0001';
  end if;

  update public.property_images
  set position = position + 100000
  where property_id = pid;

  update public.property_images
  set position = 0
  where id = target_image;

  with ordered as (
    select
      id,
      row_number() over (
        order by case when id = target_image then -1 else position end
      ) - 1 as pos
    from public.property_images
    where property_id = pid
  )
  update public.property_images as image
  set position = ordered.pos
  from ordered
  where image.id = ordered.id;
end;
$$;

create or replace function public.market_stats()
returns table (
  listing_count bigint,
  city_count bigint,
  median_price_php numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*),
    count(distinct city),
    coalesce(
      (
        select percentile_cont(0.5) within group (order by sale.price_php)
        from public.properties as sale
        where sale.status = 'published'
          and sale.listing_type = 'sale'
      ),
      0
    )
  from public.properties
  where status = 'published';
$$;

create or replace function public.list_cities()
returns table (
  name text,
  province text,
  count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select city, province, count(*)
  from public.properties
  where status = 'published'
  group by city, province
  order by count(*) desc, city asc;
$$;

create or replace function public.visible_inquiries()
returns table (
  id uuid,
  property_id uuid,
  property_title text,
  property_slug text,
  agent_id uuid,
  buyer_id uuid,
  name text,
  email text,
  phone text,
  message text,
  preferred_viewing_date date,
  status public.inquiry_status,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    inquiry.id,
    inquiry.property_id,
    property.title,
    property.slug,
    property.agent_id,
    inquiry.buyer_id,
    inquiry.name,
    inquiry.email,
    inquiry.phone,
    inquiry.message,
    inquiry.preferred_viewing_date,
    inquiry.status,
    inquiry.created_at
  from public.inquiries as inquiry
  join public.properties as property on property.id = inquiry.property_id
  where public.is_admin()
    or inquiry.buyer_id = auth.uid()
    or property.agent_id = auth.uid();
$$;

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  role public.app_role,
  full_name text,
  phone text,
  agency text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    users.email::text,
    profile.role,
    profile.full_name,
    profile.phone,
    profile.agency,
    profile.created_at
  from public.profiles as profile
  join auth.users as users on users.id = profile.id
  where public.is_admin()
  order by profile.created_at asc;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger properties_touch_updated_at
before update on public.properties
for each row execute function public.touch_updated_at();

create trigger properties_enforce_listing_transition
before insert or update on public.properties
for each row execute function public.enforce_listing_transition();

create trigger inquiries_enforce_throttle
before insert on public.inquiries
for each row execute function public.enforce_inquiry_throttle();

create trigger inquiries_restrict_updates
before update on public.inquiries
for each row execute function public.restrict_inquiry_update();

alter function public.current_app_role() owner to postgres;
alter function public.is_admin() owner to postgres;
alter function public.handle_new_user() owner to postgres;
alter function public.prevent_role_escalation() owner to postgres;
alter function public.enforce_listing_transition() owner to postgres;
alter function public.enforce_inquiry_throttle() owner to postgres;
alter function public.restrict_inquiry_update() owner to postgres;
alter function public.visible_inquiries() owner to postgres;
alter function public.admin_list_users() owner to postgres;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
revoke all on function public.enforce_listing_transition() from public, anon, authenticated;
revoke all on function public.enforce_inquiry_throttle() from public, anon, authenticated;
revoke all on function public.restrict_inquiry_update() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_app_role() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

revoke all on function public.set_cover_image(uuid) from public;
grant execute on function public.set_cover_image(uuid) to authenticated, service_role;

revoke all on function public.market_stats() from public;
grant execute on function public.market_stats() to anon, authenticated, service_role;

revoke all on function public.list_cities() from public;
grant execute on function public.list_cities() to anon, authenticated, service_role;

revoke all on function public.visible_inquiries() from public;
grant execute on function public.visible_inquiries() to authenticated, service_role;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated, service_role;

grant execute on function public.handle_new_user() to supabase_auth_admin;

alter table public.profiles enable row level security;
alter table public.listing_transition_rules enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;

create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy profiles_select_public
on public.profiles
for select
to anon, authenticated
using (
  id = auth.uid()
  or (
    role = 'agent'
    and exists (
      select 1
      from public.properties as property
      where property.agent_id = profiles.id
        and property.status in ('published', 'sold')
    )
  )
);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy transition_rules_read
on public.listing_transition_rules
for select
to anon, authenticated
using (true);

create policy properties_admin_all
on public.properties
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy properties_select
on public.properties
for select
to anon, authenticated
using (
  status in ('published', 'sold')
  or agent_id = auth.uid()
);

create policy properties_insert_own
on public.properties
for insert
to authenticated
with check (
  public.current_app_role() = 'agent'
  and agent_id = auth.uid()
);

create policy properties_update_own
on public.properties
for update
to authenticated
using (public.current_app_role() = 'agent' and agent_id = auth.uid())
with check (public.current_app_role() = 'agent' and agent_id = auth.uid());

create policy properties_delete_own
on public.properties
for delete
to authenticated
using (public.current_app_role() = 'agent' and agent_id = auth.uid());

-- An image is visible when its property is visible. Writes stay with the owner.
create policy property_images_select
on public.property_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties as property
    where property.id = property_images.property_id
  )
);

create policy property_images_insert
on public.property_images
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.properties as property
    where property.id = property_id
      and property.agent_id = auth.uid()
      and public.current_app_role() = 'agent'
  )
);

create policy property_images_update
on public.property_images
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.properties as property
    where property.id = property_images.property_id
      and property.agent_id = auth.uid()
      and public.current_app_role() = 'agent'
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.properties as property
    where property.id = property_id
      and property.agent_id = auth.uid()
      and public.current_app_role() = 'agent'
  )
);

create policy property_images_delete
on public.property_images
for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.properties as property
    where property.id = property_images.property_id
      and property.agent_id = auth.uid()
      and public.current_app_role() = 'agent'
  )
);

create policy favorites_select
on public.favorites
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy favorites_insert
on public.favorites
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.properties as property
    where property.id = property_id
      and property.status in ('published', 'sold')
  )
);

create policy favorites_delete
on public.favorites
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy inquiries_select
on public.inquiries
for select
to authenticated
using (
  public.is_admin()
  or buyer_id = auth.uid()
  or exists (
    select 1
    from public.properties as property
    where property.id = inquiries.property_id
      and property.agent_id = auth.uid()
  )
);

create policy inquiries_insert
on public.inquiries
for insert
to anon, authenticated
with check (
  (buyer_id is null or buyer_id = auth.uid())
  and exists (
    select 1
    from public.properties as property
    where property.id = property_id
      and property.status = 'published'
  )
);

create policy inquiries_update
on public.inquiries
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.properties as property
    where property.id = inquiries.property_id
      and property.agent_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.properties as property
    where property.id = property_id
      and property.agent_id = auth.uid()
  )
);

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
on public.profiles, public.properties, public.property_images, public.favorites, public.inquiries
to anon, authenticated, service_role;

grant select on public.listing_transition_rules to anon, authenticated, service_role;
grant insert, update, delete on public.listing_transition_rules to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy property_images_bucket_read
on storage.objects
for select
to public
using (bucket_id = 'property-images');

create policy property_images_bucket_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_app_role() in ('agent', 'admin')
);

create policy property_images_bucket_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_app_role() in ('agent', 'admin')
)
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_app_role() in ('agent', 'admin')
);

create policy property_images_bucket_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.current_app_role() in ('agent', 'admin')
);
