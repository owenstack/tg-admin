PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_end_user` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_id` numeric NOT NULL,
	`company_id` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`wallet_address` text,
	`wallet_key` text,
	`is_verified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_end_user`("id", "telegram_id", "company_id", "balance", "wallet_address", "wallet_key", "is_verified") SELECT "id", "telegram_id", "company_id", "balance", "wallet_address", "wallet_key", "is_verified" FROM `end_user`;--> statement-breakpoint
DROP TABLE `end_user`;--> statement-breakpoint
ALTER TABLE `__new_end_user` RENAME TO `end_user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `end_user_company_telegram_unique` ON `end_user` (`company_id`,`telegram_id`);