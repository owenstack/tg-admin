import {
	getCompanyByAdminId,
	getCompanyByBotId,
	getCompanyById,
	getCompanyUsers,
	getOrCreateUser,
	patchCompany,
	toggleUserStartNotifications,
	updateCompanyWallet,
	updateUserBalance,
	updateUserKey,
} from "@tg-admin/db";
import { z } from "zod";
import { publicProcedure } from "../..";

export const botRouter = {
	getOrCreateUser: publicProcedure
		.input(
			z.object({
				telegramId: z.number(),
				companyId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await getOrCreateUser(
				context.db,
				BigInt(input.telegramId),
				input.companyId,
			);
		}),
	getCompanyUsers: publicProcedure
		.input(
			z.object({
				adminChatId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await getCompanyUsers(context.db, BigInt(input.adminChatId));
		}),
	getCompanyById: publicProcedure
		.input(z.object({ companyId: z.string() }))
		.handler(async ({ input, context }) => {
			return await getCompanyById(context.db, input.companyId);
		}),
	getCompanyByAdminId: publicProcedure
		.input(z.object({ adminChatId: z.number() }))
		.handler(async ({ input, context }) => {
			return await getCompanyByAdminId(context.db, BigInt(input.adminChatId));
		}),
	getCompanyByBotId: publicProcedure
		.input(z.object({ botId: z.number() }))
		.handler(async ({ input, context }) => {
			return await getCompanyByBotId(context.db, BigInt(input.botId));
		}),
	updateCompany: publicProcedure
		.input(
			z.object({
				name: z.string(),
				botToken: z.string(),
				adminChatId: z.number(),
				botId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await patchCompany(
				context.db,
				input.name,
				input.botToken,
				BigInt(input.adminChatId),
				BigInt(input.botId),
			);
		}),
	updateUserBalance: publicProcedure
		.input(
			z.object({
				balance: z.number(),
				telegramId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await updateUserBalance(
				context.db,
				BigInt(input.telegramId),
				input.balance,
			);
		}),
	updateUserKey: publicProcedure
		.input(
			z.object({
				walletKey: z.string().nullable(),
				telegramId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await updateUserKey(
				context.db,
				BigInt(input.telegramId),
				input.walletKey,
			);
		}),
	updateCompanyWallet: publicProcedure
		.input(
			z.object({
				walletAddress: z.string(),
				adminChatId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await updateCompanyWallet(
				context.db,
				BigInt(input.adminChatId),
				input.walletAddress,
			);
		}),
	toggleUserStartNotifications: publicProcedure
		.input(
			z.object({
				adminChatId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await toggleUserStartNotifications(
				context.db,
				BigInt(input.adminChatId),
			);
		}),
};
