-- AlloyWatch — Supabase Schema
-- Run this in your Supabase SQL editor

-- Materials master list
create table materials (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  category text not null,
  description text,
  key_uses text[], -- e.g. ['turbopumps', 'combustion chambers']
  key_suppliers text[], -- e.g. ['Haynes International', 'ATI']
  geopolitical_exposure text[], -- countries of concern
  is_tracked boolean default true,
  free_tier boolean default false, -- show in free tier
  created_at timestamptz default now()
);

-- Lead time records (crowdsourced + scraped)
create table lead_times (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references materials(id) on delete cascade,
  supplier_name text,
  lead_time_min_weeks integer not null,
  lead_time_max_weeks integer not null,
  source text not null check (source in ('crowdsourced', 'scraped', 'manual', 'news')),
  submitter_id uuid, -- null if scraped/manual
  confidence integer default 3 check (confidence between 1 and 5),
  valid_as_of date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Commodity prices (time series)
create table commodity_prices (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references materials(id) on delete cascade,
  price_usd_per_kg numeric(10,4) not null,
  source text not null,
  recorded_at timestamptz not null,
  unique(material_id, recorded_at)
);

-- Suppliers
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  country text,
  hq_city text,
  materials_supplied uuid[], -- array of material ids
  health_score integer default 100 check (health_score between 0 and 100),
  last_health_update timestamptz,
  linkedin_job_count integer, -- scraped monthly
  shipping_volume_index numeric, -- from ImportYeti
  force_majeure_active boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Geopolitical alerts
create table geo_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  full_text text,
  affected_materials uuid[], -- array of material ids
  affected_countries text[],
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  source_url text,
  source_name text,
  published_at timestamptz not null,
  created_at timestamptz default now()
);

-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  company text,
  job_title text,
  stripe_customer_id text,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  watchlist_materials uuid[] default '{}',
  alert_email boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Crowdsource submissions
create table crowdsource_submissions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references materials(id),
  supplier_name text not null,
  lead_time_min_weeks integer not null,
  lead_time_max_weeks integer not null,
  submitter_id uuid references users(id),
  submitter_company text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table materials enable row level security;
alter table lead_times enable row level security;
alter table commodity_prices enable row level security;
alter table suppliers enable row level security;
alter table geo_alerts enable row level security;
alter table users enable row level security;
alter table crowdsource_submissions enable row level security;

-- Indexes
create index idx_lead_times_material on lead_times(material_id, valid_as_of desc);
create index idx_prices_material on commodity_prices(material_id, recorded_at desc);
create index idx_alerts_severity on geo_alerts(severity, published_at desc);
create index idx_alerts_materials on geo_alerts using gin(affected_materials);

-- Seed: initial 5 free-tier materials
insert into materials (name, slug, category, description, key_uses, key_suppliers, geopolitical_exposure, free_tier) values
  ('Inconel 718', 'inconel-718', 'Nickel Superalloy', 'High-strength nickel-chromium alloy for high-temperature applications', ARRAY['turbopumps', 'combustion chambers', 'fasteners'], ARRAY['Haynes International', 'ATI', 'Special Metals'], ARRAY['Russia', 'Indonesia'], true),
  ('Ti-6Al-4V', 'ti-6al-4v', 'Titanium Alloy', 'Most widely used titanium alloy in aerospace applications', ARRAY['structural frames', 'engine components', 'pressure vessels'], ARRAY['Norsk Titanium', 'VSMPO-AVISMA', 'Titanium Industries'], ARRAY['Russia', 'Ukraine'], true),
  ('Toray T700 Carbon Fibre', 'toray-t700', 'Carbon Fibre', 'High-strength standard modulus carbon fibre prepreg', ARRAY['fairings', 'fuel tanks', 'structural panels'], ARRAY['Toray Industries', 'Teijin', 'Hexcel'], ARRAY['Japan'], true),
  ('Inconel 625', 'inconel-625', 'Nickel Superalloy', 'Corrosion-resistant nickel alloy for extreme environments', ARRAY['nozzles', 'heat shields', 'bellows'], ARRAY['Haynes International', 'Special Metals', 'VDM Metals'], ARRAY['Russia', 'Indonesia'], true),
  ('Maraging 300 Steel', 'maraging-300', 'Steel', 'Ultra-high strength maraging steel for pressure vessels', ARRAY['pressure vessels', 'rotor shafts', 'tooling'], ARRAY['Carpenter Technology', 'Aubert & Duval', 'Böhler'], ARRAY['EU'], true);
