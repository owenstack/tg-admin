import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { endUser } from "../schema";

export async function getOrCreateUser(telegramId: bigint, companyId: string) {
	const existingUser = await db.query.endUser.findFirst({
		where: and(
			eq(endUser.telegramId, telegramId),
			eq(endUser.companyId, companyId),
		),
	});

	if (existingUser) {
		return existingUser;
	}

	const newUser = await db
		.insert(endUser)
		.values({
			telegramId,
			companyId,
		})
		.returning();

	return newUser[0];
}
