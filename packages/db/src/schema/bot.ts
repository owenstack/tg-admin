import { sql } from "drizzle-orm";
import {
	integer,
	numeric,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "./utils";

// Companies using the service
export const company = sqliteTable("company", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	botToken: text("bot_token").notNull(),
	adminChatId: text("admin_chat_id"), // nullable
	walletAddress: text("wallet_address"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Actual people using the company bots
export const endUser = sqliteTable(
	"end_user",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => nanoid()),
		telegramId: numeric("telegram_id", { mode: "bigint" }).notNull(),
		companyId: text("company_id")
			.notNull()
			.references(() => company.id),
		balance: integer("balance").notNull().default(0), // in cents
		walletKey: text("wallet_key"),
	},
	(t) => [
		uniqueIndex("end_user_company_telegram_unique").on(
			t.companyId,
			t.telegramId,
		),
	],
);
