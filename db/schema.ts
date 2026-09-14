import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    githubAccessToken: text("github_access_token"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});