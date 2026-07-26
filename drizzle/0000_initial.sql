CREATE TABLE `dreams` (
  `id` text PRIMARY KEY NOT NULL,
  `owner` text NOT NULL,
  `title` text NOT NULL,
  `date` text NOT NULL,
  `month` text NOT NULL,
  `day` text NOT NULL,
  `raw_text` text NOT NULL,
  `editable_text` text NOT NULL,
  `summary` text DEFAULT '' NOT NULL,
  `emotion` text DEFAULT '未标记' NOT NULL,
  `intensity` integer DEFAULT 5 NOT NULL,
  `tags` text DEFAULT '[]' NOT NULL,
  `context` text DEFAULT '{}' NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` text NOT NULL,
  `deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `dreams_owner_status_created_idx` ON `dreams` (`owner`, `status`, `created_at`);
--> statement-breakpoint
CREATE TABLE `dream_drafts` (
  `owner` text PRIMARY KEY NOT NULL,
  `content` text DEFAULT '' NOT NULL,
  `emotion` text DEFAULT '未标记' NOT NULL,
  `context` text DEFAULT '{}' NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
  `id` text PRIMARY KEY NOT NULL,
  `dream_id` text NOT NULL,
  `owner` text NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  `kind` text NOT NULL,
  `content` text NOT NULL,
  `model` text DEFAULT 'qwen3.7-plus' NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_owner_dream_idx` ON `reports` (`owner`, `dream_id`, `version`);
--> statement-breakpoint
CREATE TABLE `creative_projects` (
  `id` text PRIMARY KEY NOT NULL,
  `dream_id` text NOT NULL,
  `owner` text NOT NULL,
  `kind` text NOT NULL,
  `adaptation_mode` text DEFAULT 'balanced' NOT NULL,
  `story_bible` text DEFAULT '{}' NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `creative_projects_owner_dream_idx` ON `creative_projects` (`owner`, `dream_id`);
--> statement-breakpoint
CREATE TABLE `generation_jobs` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `owner` text NOT NULL,
  `job_type` text NOT NULL,
  `model` text NOT NULL,
  `status` text DEFAULT 'queued' NOT NULL,
  `idempotency_key` text NOT NULL,
  `estimated_cost_fen` integer DEFAULT 0 NOT NULL,
  `result` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `generation_jobs_idempotency_key_unique` ON `generation_jobs` (`idempotency_key`);
--> statement-breakpoint
CREATE TABLE `visual_assets` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `owner` text NOT NULL,
  `scene_id` text,
  `r2_key` text NOT NULL,
  `media_type` text NOT NULL,
  `model` text NOT NULL,
  `prompt_hash` text NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visual_assets_owner_project_idx` ON `visual_assets` (`owner`, `project_id`);
