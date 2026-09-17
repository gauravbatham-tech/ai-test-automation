import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    githubAccessToken: text("github_access_token"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testCases = pgTable("test_cases", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    repository: text("repository").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    steps: text("steps").notNull(),
    actions: text("actions").notNull(),
    expectedResult: text("expected_result").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testExecutions = pgTable("test_executions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    testId: text("test_id"),
    status: text("status").notNull(),
    sessionId: text("session_id"),
    recordingUrl: text("recording_url"),
    logs: text("logs").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectSettings = pgTable("project_settings", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    repository: text("repository").notNull().unique(),
    targetUrl: text("target_url").notNull(),
    demoEmail: text("demo_email"),
    demoPassword: text("demo_password"),
    globalInstructions: text("global_instructions"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});