import { and, eq } from "drizzle-orm";
import type { DrizzleDB } from "../db";
import { endUser } from "../schema";

export async function getOrCreateUser(
	db: DrizzleDB,
	telegramId: bigint,
	companyId: string,
) {
	try {
		const data = await db.query.endUser.findFirst({
			where: and(
				eq(endUser.telegramId, telegramId),
				eq(endUser.companyId, companyId),
			),
		});

		if (data) {
			return { data };
		}

		const [newUser] = await db
			.insert(endUser)
			.values({
				telegramId,
				companyId,
			})
			.returning();

		return { data: newUser };
	} catch (error) {
		return { error: (error as Error).message };
	}
}
