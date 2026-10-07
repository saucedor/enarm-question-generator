CREATE SCHEMA IF NOT EXISTS enarm;
CREATE TABLE enarm.documents (
  id uuid PRIMARY KEY,
  filename text NOT NULL,
  media_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 5242880),
  sha256 text NOT NULL CHECK (length(sha256) = 64),
  object_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE enarm.runs (
  id uuid PRIMARY KEY,
  idempotency_key uuid NOT NULL UNIQUE,
  input jsonb NOT NULL,
  document_id uuid REFERENCES enarm.documents(id),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','retrying','completed','failed')),
  result jsonb,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE enarm.worker_heartbeat (
  id text PRIMARY KEY,
  seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX runs_created ON enarm.runs(created_at DESC);
