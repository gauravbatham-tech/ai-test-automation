CREATE TABLE "test_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"repository" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"steps" text NOT NULL,
	"expected_result" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;