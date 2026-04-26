-- Fix updated_at columns missing DEFAULT NOW() across all tables.
-- Run once in Supabase SQL editor.
-- After this, the code-side updated_at: new Date() inserts are still fine
-- but new rows inserted without it will also work correctly.

ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE routes ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE audits ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE issues ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE photos ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE recommendations ALTER COLUMN updated_at SET DEFAULT NOW();

-- Verify
SELECT table_name, column_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'updated_at'
ORDER BY table_name;
