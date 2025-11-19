CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bot_token` text NOT NULL,
	`admin_chat_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `end_user` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_id` text NOT NULL,
	`company_id` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`wallet_address` text,
	`wallet_key` text,
	`is_verified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `end_user_company_telegram_unique` ON `end_user` (`company_id`,`telegram_id`);