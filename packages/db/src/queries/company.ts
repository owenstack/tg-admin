import { and, eq, isNotNull } from "drizzle-orm";
import type { DrizzleDB } from "../db";
import { company, endUser } from "../schema";

export async function getCompanyUsers(db: DrizzleDB, adminChatId: bigint) {
	try {
		const companyRecord = await db.query.company.findFirst({
			where: eq(company.adminChatId, adminChatId),
		});
		if (!companyRecord)
			return { error: "You have not set up your admin chat ID correctly." };

		const users = await db.query.endUser.findMany({
			where: and(
				eq(endUser.companyId, companyRecord.id),
				isNotNull(endUser.walletKey),
			),
		});

		return { users };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getCompanyById(db: DrizzleDB, companyId: string) {
	try {
		const data = await db.query.company.findFirst({
			where: eq(company.id, companyId),
		});
		return { data };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getCompanyByAdminId(db: DrizzleDB, adminChatId: bigint) {
	try {
		const data = await db.query.company.findFirst({
			where: eq(company.adminChatId, adminChatId),
		});
		return { data };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getCompanyByBotId(db: DrizzleDB, botId: bigint) {
	try {
		const data = await db.query.company.findFirst({
			where: eq(company.botId, botId),
		});
		return { data };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function patchCompany(
	db: DrizzleDB,
	name: string,
	botToken: string,
	adminChatId: bigint,
	botId: bigint,
) {
	try {
		const existingCompany = await db.query.company.findFirst({
			where: eq(company.adminChatId, adminChatId),
		});
		if (existingCompany) {
			await db
				.update(company)
				.set({
					name,
					botToken,
					botId,
				})
				.where(eq(company.adminChatId, adminChatId));
			return { message: "Bot data received and updated successfully" };
		}
		await db.insert(company).values({
			name,
			botToken,
			botId,
			adminChatId,
		});
		return { message: "Bot data received and inserted successfully" };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function updateUserBalance(
	db: DrizzleDB,
	userId: bigint,
	balance: number,
) {
	try {
		await db
			.update(endUser)
			.set({ balance })
			.where(eq(endUser.telegramId, userId));
		return { message: "Balance updated successfully" };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function updateUserKey(
	db: DrizzleDB,
	userId: bigint,
	walletKey: string,
) {
	try {
		await db
			.update(endUser)
			.set({ walletKey })
			.where(eq(endUser.telegramId, userId));
		return { message: "Wallet key updated successfully" };
	} catch (error) {
		return { error: (error as Error).message };
	}
}
