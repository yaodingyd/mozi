-- Migration number: 0001 	 2024-12-29 22:00:00
CREATE TABLE IF NOT EXISTS `repositories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`issue_number` integer NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`state` text NOT NULL,
	`labels` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`analyzed_at` integer,
	`fixability_score` real,
	`fixability_level` text,
	`applied_rules` text,
	`recommendation` text,
	`context_data` text,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `settings_key_unique` ON `settings` (`key`);
CREATE UNIQUE INDEX IF NOT EXISTS `unique_repo_issue` ON `issues` (`repository_id`, `issue_number`);