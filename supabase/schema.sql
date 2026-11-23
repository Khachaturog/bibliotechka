-- Bibliotechka — Supabase Postgres schema (from database/init.sql)
-- Apply in Supabase Dashboard → SQL Editor, or via service_role / DATABASE_URL.
-- Idempotent where practical (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- Tables (PK = slug; text instead of MySQL varchar/enums)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.groups (
  slug text PRIMARY KEY,
  title_ru text NOT NULL,
  title_en text DEFAULT '',
  badge text DEFAULT '',
  cover text DEFAULT '',
  description_ru text,
  description_seo text,
  keywords_seo text DEFAULT '',
  og_description text,
  og_image text DEFAULT '',
  og_title text DEFAULT '',
  sort integer DEFAULT 0,
  title_seo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_sort ON public.groups (sort);

CREATE TABLE IF NOT EXISTS public.subgroups (
  slug text PRIMARY KEY,
  title_ru text NOT NULL,
  title_en text DEFAULT '',
  description_ru text,
  status text DEFAULT '',
  group_slug text REFERENCES public.groups (slug) ON DELETE SET NULL ON UPDATE CASCADE,
  sort integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subgroups_group_slug ON public.subgroups (group_slug);
CREATE INDEX IF NOT EXISTS idx_subgroups_group_sort ON public.subgroups (group_slug, sort);

CREATE TABLE IF NOT EXISTS public.versions (
  slug text PRIMARY KEY,
  version text NOT NULL,
  title text NOT NULL,
  description text,
  release_date text,
  url text,
  created_at_db timestamptz DEFAULT now(),
  updated_at_db timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.authors (
  slug text PRIMARY KEY,
  title_ru text NOT NULL,
  title_en text,
  avatar text,
  created_at_db timestamptz DEFAULT now(),
  updated_at_db timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data (
  slug text PRIMARY KEY,
  title text NOT NULL,
  cover_short text DEFAULT '',
  cover_large text DEFAULT '',
  url_seo_yandex text,
  url_seo_google text,
  description text,
  author_slug text DEFAULT '',
  status_slug text DEFAULT '',
  group_slug text REFERENCES public.groups (slug) ON DELETE SET NULL ON UPDATE CASCADE,
  subgroup_slug text REFERENCES public.subgroups (slug) ON DELETE SET NULL ON UPDATE CASCADE,
  url_title_1 text DEFAULT '',
  url_1 text,
  url_title_2 text DEFAULT '',
  url_2 text,
  url_title_3 text DEFAULT '',
  url_3 text,
  url_title_4 text DEFAULT '',
  url_4 text,
  url_title_5 text DEFAULT '',
  url_5 text,
  url_title_6 text DEFAULT '',
  url_6 text,
  start_date text DEFAULT '',
  end_date text DEFAULT '',
  published text DEFAULT '',
  created_at text DEFAULT '',
  updated_at text DEFAULT '',
  summary_ai text,
  detail text,
  comment text,
  version_slug text REFERENCES public.versions (slug) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at_db timestamptz DEFAULT now(),
  updated_at_db timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_group_slug ON public.data (group_slug);
CREATE INDEX IF NOT EXISTS idx_data_subgroup_slug ON public.data (subgroup_slug);
CREATE INDEX IF NOT EXISTS idx_data_status_slug ON public.data (status_slug);
CREATE INDEX IF NOT EXISTS idx_data_group_subgroup ON public.data (group_slug, subgroup_slug);
CREATE INDEX IF NOT EXISTS idx_data_version_slug ON public.data (version_slug);

CREATE TABLE IF NOT EXISTS public.card_authors (
  card_slug text NOT NULL REFERENCES public.data (slug) ON DELETE CASCADE,
  author_slug text NOT NULL REFERENCES public.authors (slug) ON DELETE CASCADE,
  created_at_db timestamptz DEFAULT now(),
  PRIMARY KEY (card_slug, author_slug)
);

CREATE INDEX IF NOT EXISTS idx_card_authors_card_slug ON public.card_authors (card_slug);
CREATE INDEX IF NOT EXISTS idx_card_authors_author_slug ON public.card_authors (author_slug);

-- ---------------------------------------------------------------------------
-- updated_at helpers (MySQL ON UPDATE CURRENT_TIMESTAMP equivalent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at_db()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at_db = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_groups_updated_at ON public.groups;
CREATE TRIGGER trg_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_subgroups_updated_at ON public.subgroups;
CREATE TRIGGER trg_subgroups_updated_at
  BEFORE UPDATE ON public.subgroups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_versions_updated_at_db ON public.versions;
CREATE TRIGGER trg_versions_updated_at_db
  BEFORE UPDATE ON public.versions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_db();

DROP TRIGGER IF EXISTS trg_authors_updated_at_db ON public.authors;
CREATE TRIGGER trg_authors_updated_at_db
  BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_db();

DROP TRIGGER IF EXISTS trg_data_updated_at_db ON public.data;
CREATE TRIGGER trg_data_updated_at_db
  BEFORE UPDATE ON public.data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_db();

-- ---------------------------------------------------------------------------
-- RLS: anon/authenticated SELECT only; data rows only when published.
-- Writes: service_role / Dashboard only (no INSERT/UPDATE/DELETE policies).
-- ---------------------------------------------------------------------------

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_groups" ON public.groups;
CREATE POLICY "anon_select_groups"
  ON public.groups FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_select_subgroups" ON public.subgroups;
CREATE POLICY "anon_select_subgroups"
  ON public.subgroups FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_select_versions" ON public.versions;
CREATE POLICY "anon_select_versions"
  ON public.versions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_select_authors" ON public.authors;
CREATE POLICY "anon_select_authors"
  ON public.authors FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_select_published_data" ON public.data;
CREATE POLICY "anon_select_published_data"
  ON public.data FOR SELECT
  TO anon, authenticated
  USING (status_slug = 'published');

DROP POLICY IF EXISTS "anon_select_card_authors" ON public.card_authors;
CREATE POLICY "anon_select_card_authors"
  ON public.card_authors FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicit write revoke / read grant on catalog tables only
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.groups, public.subgroups, public.versions,
  public.authors, public.data, public.card_authors
  FROM anon, authenticated;
GRANT SELECT ON
  public.groups, public.subgroups, public.versions,
  public.authors, public.data, public.card_authors
  TO anon, authenticated;
