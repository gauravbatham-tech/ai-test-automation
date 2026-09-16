import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const testCases = pgTable("test_cases", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    repository: text("repository").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    steps: text("steps").notNull(),
    expectedResult: text("expected_result").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});