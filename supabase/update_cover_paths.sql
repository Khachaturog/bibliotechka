-- Rewrite cover paths after covers are in web/public/covers/{short,large}/
-- Applied to project nsxhexxgcjujuhkoyzaj during phase 2.

UPDATE public.data
SET
  cover_short = '/covers/short/' || slug || '.webp',
  cover_large = '/covers/large/' || slug || '.webp';

-- groups.cover already points at images/groups/{slug}.webp (repo images/); leave as-is.
