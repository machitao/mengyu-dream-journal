import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const dreams = sqliteTable("dreams", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  month: text("month").notNull(),
  day: text("day").notNull(),
  rawText: text("raw_text").notNull(),
  editableText: text("editable_text").notNull(),
  summary: text("summary").notNull().default(""),
  emotion: text("emotion").notNull().default("未标记"),
  intensity: integer("intensity").notNull().default(5),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  context: text("context", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const dreamDrafts = sqliteTable("dream_drafts", {
  owner: text("owner").primaryKey(),
  content: text("content").notNull().default(""),
  emotion: text("emotion").notNull().default("未标记"),
  context: text("context", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: text("updated_at").notNull(),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  dreamId: text("dream_id").notNull(),
  owner: text("owner").notNull(),
  version: integer("version").notNull().default(1),
  kind: text("kind").notNull(),
  content: text("content", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  model: text("model").notNull().default("qwen3.7-plus"),
  createdAt: text("created_at").notNull(),
});

export const creativeProjects = sqliteTable("creative_projects", {
  id: text("id").primaryKey(),
  dreamId: text("dream_id").notNull(),
  owner: text("owner").notNull(),
  kind: text("kind").notNull(),
  adaptationMode: text("adaptation_mode").notNull().default("balanced"),
  storyBible: text("story_bible", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
});

export const generationJobs = sqliteTable("generation_jobs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  owner: text("owner").notNull(),
  jobType: text("job_type").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull().default("queued"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  estimatedCostFen: integer("estimated_cost_fen").notNull().default(0),
  result: text("result", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull(),
});

export const visualAssets = sqliteTable("visual_assets", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  owner: text("owner").notNull(),
  sceneId: text("scene_id"),
  r2Key: text("r2_key").notNull(),
  mediaType: text("media_type").notNull(),
  model: text("model").notNull(),
  promptHash: text("prompt_hash").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull(),
});
