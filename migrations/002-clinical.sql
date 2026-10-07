ALTER TABLE enarm.documents ADD COLUMN pages jsonb;
ALTER TABLE enarm.documents ADD COLUMN extraction_status text NOT NULL DEFAULT 'pending' CHECK(extraction_status IN ('pending','ready','failed'));
ALTER TABLE enarm.documents ADD COLUMN extraction_error text;
ALTER TABLE enarm.runs ADD COLUMN parent_set_id uuid;
CREATE TABLE enarm.question_sets (
 id uuid PRIMARY KEY REFERENCES enarm.runs(id),
 title text NOT NULL,
 input jsonb NOT NULL,
 cases jsonb NOT NULL,
 sources jsonb NOT NULL,
 metadata jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 review_status text NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','reviewed')),
 review_note text NOT NULL DEFAULT '',
 parent_id uuid REFERENCES enarm.question_sets(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE enarm.runs ADD CONSTRAINT runs_parent_set FOREIGN KEY(parent_set_id) REFERENCES enarm.question_sets(id);
CREATE TABLE enarm.practice_attempts (
 id uuid PRIMARY KEY,
 set_id uuid NOT NULL REFERENCES enarm.question_sets(id),
 revision integer NOT NULL,
 snapshot jsonb NOT NULL,
 answers jsonb,
 completed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX question_sets_created ON enarm.question_sets(created_at DESC);
CREATE TABLE enarm.source_cache (
 id text PRIMARY KEY,
 evidence jsonb NOT NULL,
 fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE enarm.worker_heartbeat ADD COLUMN generation_ready boolean NOT NULL DEFAULT false;
ALTER TABLE enarm.worker_heartbeat ADD COLUMN model text;
