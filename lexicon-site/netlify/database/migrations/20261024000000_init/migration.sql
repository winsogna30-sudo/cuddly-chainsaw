CREATE TABLE IF NOT EXISTS user_data (
  user_id text PRIMARY KEY,
  email text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
