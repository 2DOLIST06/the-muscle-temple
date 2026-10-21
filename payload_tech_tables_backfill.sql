BEGIN;

CREATE TABLE IF NOT EXISTS "payload_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "key" varchar,
  "value" jsonb,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "document_id" integer,
  "global_slug" varchar,
  "user_id" integer NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_jobs" (
  "id" serial PRIMARY KEY NOT NULL,
  "input" jsonb,
  "task_slug" varchar,
  "queue" varchar,
  "wait_until" timestamp(3) with time zone,
  "processing" boolean DEFAULT false,
  "completed_at" timestamp(3) with time zone,
  "has_error" boolean DEFAULT false,
  "error" jsonb,
  "retries" numeric DEFAULT 0,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_kv" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" varchar NOT NULL,
  "value" jsonb,
  "expires_at" timestamp(3) with time zone,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "payload_preferences"
  ADD CONSTRAINT "payload_preferences_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents"
  ADD CONSTRAINT "payload_locked_documents_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "payload_preferences_user_id_key_idx"
  ON "payload_preferences" ("user_id", "key");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_document_id_idx"
  ON "payload_locked_documents" ("document_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx"
  ON "payload_locked_documents" ("global_slug");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_user_idx"
  ON "payload_locked_documents" ("user_id");
CREATE INDEX IF NOT EXISTS "payload_jobs_queue_idx"
  ON "payload_jobs" ("queue");
CREATE INDEX IF NOT EXISTS "payload_jobs_wait_until_idx"
  ON "payload_jobs" ("wait_until");
CREATE INDEX IF NOT EXISTS "payload_jobs_processing_idx"
  ON "payload_jobs" ("processing");
CREATE INDEX IF NOT EXISTS "payload_jobs_completed_at_idx"
  ON "payload_jobs" ("completed_at");
CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx"
  ON "payload_kv" ("key");
CREATE INDEX IF NOT EXISTS "payload_kv_expires_at_idx"
  ON "payload_kv" ("expires_at");

COMMIT;
