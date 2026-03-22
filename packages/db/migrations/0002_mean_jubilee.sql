CREATE TABLE `wallet_job` (
	`id` text PRIMARY KEY NOT NULL,
	`end_user_id` text NOT NULL,
	`wallet_key` text NOT NULL,
	`last_checked_at` integer,
	`last_transferred_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`end_user_id`) REFERENCES `end_user`(`id`) ON UPDATE no action ON DELETE cascade
);
