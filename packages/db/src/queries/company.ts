import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../db";
import { company, endUser } from "../schema";

export async function getCompanyUsers(adminChatId: bigint) {
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

export async function getCompanyById(companyId: string) {
	try {
		const data = await db.query.company.findFirst({
			where: eq(company.id, companyId),
		});
		return { data };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getCompanyByAdminId(adminChatId: bigint) {
	try {
		const data = await db.query.company.findFirst({
			where: eq(company.adminChatId, adminChatId),
		});
		return { data };
	} catch (error) {
		return { error: (error as Error).message };
	}
}

export async function getCompanyByBotId(botId: bigint) {
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
	name: string,
	botToken: string,
	adminChatId: bigint,
	botId: bigint,
) {
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
	}
	await db.insert(company).values({
		name,
		botToken,
		botId,
		adminChatId,
	});
}

export async function updateUserBalance(userId: bigint, balance: number) {
	return await db
		.update(endUser)
		.set({ balance })
		.where(eq(endUser.telegramId, userId));
}

export async function updateUserKey(userId: bigint, walletKey: string) {
	return await db
		.update(endUser)
		.set({ walletKey })
		.where(eq(endUser.telegramId, userId));
}
