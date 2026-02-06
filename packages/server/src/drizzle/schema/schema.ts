import { InferSelectModel, sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { users } from "./auth-schema.js";

// Chats table
export const chats = sqliteTable("chats", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isFavourite: integer("is_favourite", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Chat = InferSelectModel<typeof chats>;

// Messages table
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().notNull(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  parts: text("parts", { mode: "json" }).notNull(),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Message = InferSelectModel<typeof messages>;

// Courses table
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  owner: text("owner")
    .notNull()
    .references(() => users.id),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  private: integer("private", { mode: "boolean" }).notNull().default(false),
});

export type Course = InferSelectModel<typeof courses>;

// Files table
export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey().notNull(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    name: text("name").notNull(),
    size: integer("size").notNull(),
    pageCount: integer("page_count"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [unique().on(table.courseId, table.name)],
);

export type File = InferSelectModel<typeof files>;

export const documents = sqliteTable(
  "documents",
  {
    id: text("id").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: text("kind", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    owner: text("owner")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.id, table.createdAt] })],
);

export type Document = InferSelectModel<typeof documents>;

export const suggestions = sqliteTable(
  "suggestions",
  {
    id: text("id").primaryKey().notNull(),
    documentId: text("document_id").notNull(),
    documentCreatedAt: integer("document_created_at", {
      mode: "timestamp",
    }).notNull(),
    originalText: text("original_text").notNull(),
    suggestedText: text("suggested_text").notNull(),
    description: text("description"),
    isResolved: integer("is_resolved", { mode: "boolean" })
      .notNull()
      .default(false),
    owner: text("owner")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [documents.id, documents.createdAt],
    }),
  ],
);

export type Suggestion = InferSelectModel<typeof suggestions>;

export const prompts = sqliteTable("prompts", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export type Prompt = InferSelectModel<typeof prompts>;
