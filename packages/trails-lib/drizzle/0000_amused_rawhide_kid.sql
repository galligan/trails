CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `agents_user_id_idx` ON `agents` (`user_id`);--> statement-breakpoint
CREATE INDEX `agents_created_at_idx` ON `agents` (`created_at`);--> statement-breakpoint
CREATE INDEX `agents_label_idx` ON `agents` (`label`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`ts` integer NOT NULL,
	`md` text NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notes_agent_id_idx` ON `notes` (`agent_id`);--> statement-breakpoint
CREATE INDEX `notes_ts_idx` ON `notes` (`ts`);--> statement-breakpoint
CREATE INDEX `notes_agent_id_ts_idx` ON `notes` (`agent_id`,`ts`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);