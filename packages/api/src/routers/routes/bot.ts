import {
	getCompanyByAdminId,
	getCompanyByBotId,
	getCompanyById,
	getCompanyUsers,
	getOrCreateUser,
	patchCompany,
	updateUserBalance,
	updateUserKey,
} from "@tg-admin/db";
import { z } from "zod";
import { botProcedure } from "../..";

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
	getCompanyUsers: botProcedure
		.input(
			z.object({
				adminChatId: z.number(),
			}),
		)
		.handler(async ({ input }) => {
			return await getCompanyUsers(BigInt(input.adminChatId));
		}),
	getCompanyById: botProcedure
		.input(z.object({ companyId: z.string() }))
		.handler(async ({ input }) => {
			return await getCompanyById(input.companyId);
		}),
	getCompanyByAdminId: botProcedure
		.input(z.object({ adminChatId: z.number() }))
		.handler(async ({ input }) => {
			return await getCompanyByAdminId(BigInt(input.adminChatId));
		}),
	getCompanyByBotId: botProcedure
		.input(z.object({ botId: z.number() }))
		.handler(async ({ input }) => {
			return await getCompanyByBotId(BigInt(input.botId));
		}),
	updateCompany: botProcedure
		.input(
			z.object({
				name: z.string(),
				botToken: z.string(),
				adminChatId: z.number(),
				botId: z.number(),
			}),
		)
		.handler(async ({ input }) => {
			return await patchCompany(
				input.name,
				input.botToken,
				BigInt(input.adminChatId),
				BigInt(input.botId),
			);
		}),
	updateUserBalance: botProcedure
		.input(
			z.object({
				balance: z.number(),
				telegramId: z.number(),
			}),
		)
		.handler(async ({ input }) => {
			return await updateUserBalance(BigInt(input.telegramId), input.balance);
		}),
	updateUserKey: botProcedure
		.input(
			z.object({
				walletKey: z.string(),
				telegramId: z.number(),
			}),
		)
		.handler(async ({ input }) => {
			return await updateUserKey(BigInt(input.telegramId), input.walletKey);
		}),
};
