CREATE TABLE "test_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"test_id" text,
	"status" text NOT NULL,
	"session_id" text,
	"logs" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
