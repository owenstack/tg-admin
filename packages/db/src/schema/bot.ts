import { relations, sql } from "drizzle-orm";
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
	botId: numeric("bot_id", { mode: "bigint" }).notNull().unique(),
	adminChatId: numeric("admin_chat_id", { mode: "bigint" }).notNull().unique(),
	walletAddress: text("wallet_address"),
	notifyOnUserStart: integer("notify_on_user_start", { mode: "boolean" })
		.notNull()
		.default(false),
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

// Wallet monitoring jobs - tracks wallets that need balance checks
export const walletJob = sqliteTable("wallet_job", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	endUserId: text("end_user_id")
		.notNull()
		.references(() => endUser.id, { onDelete: "cascade" }),
	walletKey: text("wallet_key").notNull(),
	lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
	lastTransferredAt: integer("last_transferred_at", { mode: "timestamp" }),
	status: text("status", { enum: ["active", "paused", "failed"] })
		.notNull()
		.default("active"),
	failureCount: integer("failure_count").notNull().default(0),
	lastError: text("last_error"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Relations
export const companyRelations = relations(company, ({ many }) => ({
	endUsers: many(endUser),
}));

export const endUserRelations = relations(endUser, ({ one, many }) => ({
	company: one(company, {
		fields: [endUser.companyId],
		references: [company.id],
	}),
	walletJobs: many(walletJob),
}));

export const walletJobRelations = relations(walletJob, ({ one }) => ({
	endUser: one(endUser, {
		fields: [walletJob.endUserId],
		references: [endUser.id],
	}),
}));
