CREATE TABLE "project_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"repository" text NOT NULL,
	"target_url" text NOT NULL,
	"demo_email" text,
	"demo_password" text,
	"global_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_settings_repository_unique" UNIQUE("repository")
);
