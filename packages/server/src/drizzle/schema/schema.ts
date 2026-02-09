import { InferSelectModel, sql } from "drizzle-orm";
import {
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

// Folders table
export const folders = sqliteTable("folders", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  owner: text("owner")
    .notNull()
    .references(() => users.id),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  visibility: text("visibility", { enum: ["private", "protected", "public"] })
    .notNull()
    .default("private"),
  encryptedKey: text("encrypted_key"),
});

export type Folder = InferSelectModel<typeof folders>;

export const courseUsers = sqliteTable(
  "course_users",
  {
    folderId: text("course_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.folderId, table.userId] })],
);

// Files table
export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey().notNull(),
    visibility: text("visibility", { enum: ["private", "protected", "public"] })
      .notNull()
      .default("private"),
    folderId: text("course_id")
      .notNull()
      .references(() => folders.id),
    name: text("name").notNull(),
    owner: text("owner")
      .notNull()
      .references(() => users.id),
    size: integer("size").notNull(),
    format: text("format").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [unique().on(table.folderId, table.name)],
);

export type File = InferSelectModel<typeof files>;

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  content: text("content"),
  kind: text("kind", { enum: ["text", "code", "sheet"] })
    .notNull()
    .default("text"),
  owner: text("owner")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Document = InferSelectModel<typeof documents>;

export const diffs = sqliteTable("diffs", {
  id: text("id").primaryKey().notNull(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  previousText: text("previous_text").notNull(),
  newText: text("new_text").notNull(),
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
});

export type Diff = InferSelectModel<typeof diffs>;

export const prompts = sqliteTable("prompts", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export type Prompt = InferSelectModel<typeof prompts>;
