import { botProcedure } from "../..";
import { z } from "zod";
import { getOrCreateUser } from "@tg-admin/db";

export const botRouter = {
	getOrCreateUser: botProcedure
		.input(
			z.object({
				telegramId: z.number(),
				companyId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			return await getOrCreateUser(BigInt(input.telegramId), input.companyId);
		}),
};
