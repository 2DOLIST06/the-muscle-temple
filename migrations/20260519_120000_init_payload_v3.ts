import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "email" varchar NOT NULL,
      "encrypted_password" varchar,
      "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt" varchar,
      "hash" varchar,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" timestamp(3) with time zone
    );
  `)

  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "media" (
      "id" serial PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "alt" varchar,
      "caption" varchar,
      "prefix" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric,
      "sizes" jsonb
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "authors" (
      "id" serial PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "avatar_id" integer,
      "bio" varchar
    );
  `)

  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "authors_slug_idx" ON "authors" ("slug");`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" varchar,
      "meta_title" varchar,
      "meta_description" varchar
    );
  `)

  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "posts" (
      "id" serial PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "excerpt" varchar,
      "featured_image_id" integer,
      "content" jsonb,
      "author_id" integer,
      "category_id" integer,
      "published_at" timestamp(3) with time zone,
      "meta_title" varchar,
      "meta_description" varchar,
      "canonical" varchar,
      "robots" varchar DEFAULT 'index,follow',
      "og_title" varchar,
      "og_description" varchar,
      "og_image_id" integer,
      "_status" varchar DEFAULT 'draft'
    );
  `)

  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" ("slug");`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "posts_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "tag" varchar NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "posts_faq" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "answer" varchar NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "posts_related_posts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "posts_id" integer
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "posts_related_posts";`)
  await db.execute(sql`DROP TABLE IF EXISTS "posts_faq";`)
  await db.execute(sql`DROP TABLE IF EXISTS "posts_tags";`)
  await db.execute(sql`DROP TABLE IF EXISTS "posts";`)
  await db.execute(sql`DROP TABLE IF EXISTS "categories";`)
  await db.execute(sql`DROP TABLE IF EXISTS "authors";`)
  await db.execute(sql`DROP TABLE IF EXISTS "media";`)
  await db.execute(sql`DROP TABLE IF EXISTS "users";`)
}
