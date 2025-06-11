CREATE TABLE `authors` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text,
	`model` text,
	`tool` text,
	`service_type` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `authors_type_idx` ON `authors` (`type`);--> statement-breakpoint
CREATE INDEX `authors_created_at_idx` ON `authors` (`created_at`);--> statement-breakpoint
CREATE INDEX `authors_tool_idx` ON `authors` (`tool`);--> statement-breakpoint
CREATE INDEX `authors_model_idx` ON `authors` (`model`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`type` text DEFAULT 'update' NOT NULL,
	`timestamp` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `entries_author_id_idx` ON `entries` (`author_id`);--> statement-breakpoint
CREATE INDEX `entries_timestamp_idx` ON `entries` (`timestamp`);--> statement-breakpoint
CREATE INDEX `entries_type_idx` ON `entries` (`type`);--> statement-breakpoint
CREATE INDEX `entries_author_id_timestamp_idx` ON `entries` (`author_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `entries_type_timestamp_idx` ON `entries` (`type`,`timestamp`);