import { isNotNull } from "drizzle-orm";
import { db } from "../db";
import { endUser } from "../schema";

export async function getAll() {
	const users = await db.query.endUser.findMany({
		where: isNotNull(endUser.walletKey),
	});
	const companies = await db.query.company.findMany();
	return { users, companies };
}
