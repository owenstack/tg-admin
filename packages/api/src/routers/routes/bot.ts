import {
	createWalletJob,
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
import { botProcedure } from "../..";

export const botRouter = {
	getOrCreateUser: botProcedure
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
	getCompanyUsers: botProcedure
		.input(
			z.object({
				adminChatId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await getCompanyUsers(context.db, BigInt(input.adminChatId));
		}),
	createMonitoringJob: botProcedure
		.input(
			z.object({
				telegramId: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			const user = await context.db.query.endUser.findFirst({
				where: (endUser, { eq }) =>
					eq(endUser.telegramId, BigInt(input.telegramId)),
			});
			if (!user) {
				return { error: "User not found" };
			}
			if (!user.walletKey) {
				return { error: "User does not have a wallet key" };
			}
			return await createWalletJob(context.db, user.id, user.walletKey);
		}),
	getCompanyById: botProcedure
		.input(z.object({ companyId: z.string() }))
		.handler(async ({ input, context }) => {
			return await getCompanyById(context.db, input.companyId);
		}),
	getCompanyByAdminId: botProcedure
		.input(z.object({ adminChatId: z.number() }))
		.handler(async ({ input, context }) => {
			return await getCompanyByAdminId(context.db, BigInt(input.adminChatId));
		}),
	getCompanyByBotId: botProcedure
		.input(z.object({ botId: z.number() }))
		.handler(async ({ input, context }) => {
			return await getCompanyByBotId(context.db, BigInt(input.botId));
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
		.handler(async ({ input, context }) => {
			return await patchCompany(
				context.db,
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
		.handler(async ({ input, context }) => {
			return await updateUserBalance(
				context.db,
				BigInt(input.telegramId),
				input.balance,
			);
		}),
	updateUserKey: botProcedure
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
	updateCompanyWallet: botProcedure
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
	toggleUserStartNotifications: botProcedure
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
