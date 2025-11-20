import { createRouterClient } from "@orpc/server";
import { createContext } from "@tg-admin/api/context";
import { appRouter } from "@tg-admin/api/routers/index";
import { Bot, webhookCallback } from "grammy/web";
import type { Context as HonoContext } from "hono";

import type { BotContext } from "../context";
import { startMessage, usersMenu } from "./content";

export function createAdminBotHandler() {
	return async (c: HonoContext<{ Bindings: CloudflareBindings }>) => {
		const adminBot = new Bot<BotContext>(c.env.TELEGRAM_BOT_TOKEN);
		const context = await createContext({ context: c });
		const api = createRouterClient(appRouter, { context }).bot;
		adminBot.use(async (ctx, next) => {
			ctx.botApi = api;
			await next();
		});
		adminBot.use(usersMenu);

		adminBot.command("start", async (ctx) => {
			const name = ctx.from?.username || ctx.from?.first_name || "admin";
			await ctx.reply(startMessage(name), {
				parse_mode: "HTML",
			});
		});

		adminBot.command("users", async (ctx) => {
			const { error, users } = await ctx.botApi.getCompanyUsers({
				adminChatId: ctx.from?.id as number,
			});
			if (error) {
				await ctx.reply(error);
				return;
			}
			if (users?.length === 0) {
				await ctx.reply("No users found for your company.");
				return;
			}
			await ctx.reply("User Management Menu:", {
				reply_markup: usersMenu,
			});
		});

		adminBot.command("setup", async (ctx) => {
		// Stateless command: /setup BOT_TOKEN BOT_NAME
		const args = ctx.match as string;
		const [botToken, name] = args.trim().split(/\s+/);

		if (!botToken || !name) {
			await ctx.reply(
				"<b>⚠️ Format Error</b>\n\nPlease provide the token and name in the command.\nUsage: <code>/setup BOT_TOKEN BOT_NAME</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		const botId = botToken.split(":")[0];
		const webhookUrl = `${c.env.BETTER_AUTH_URL}/bot/${botId}`;

		try {
			const res = await fetch(
				`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`,
			);
			const body = (await res.json()) as { ok: boolean; description?: string };

			if (!body.ok) {
				await ctx.reply(
					`Failed to set webhook: ${body.description || "Unknown error"}`,
				);
				return;
			}

			const { message, error } = await ctx.botApi.updateCompany({
				name,
				botToken,
				adminChatId: ctx.from?.id as number,
				botId: Number(botId),
			});

			if (error) {
				await ctx.reply(error);
				return;
			}
			await ctx.reply(message as string);
		} catch (e) {
			console.error(e);
			await ctx.reply("An error occurred while setting up the bot.");
		}
	});

		adminBot.command("update_balance", async (ctx) => {
		// Stateless command: /update_balance USER_ID BALANCE
		const args = ctx.match as string;
		const [userId, balance] = args.trim().split(/\s+/);

		if (!userId || !balance) {
			await ctx.reply(
				"Usage: <code>/update_balance USER_ID BALANCE</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		const { message, error } = await ctx.botApi.updateUserBalance({
			balance: Number(balance),
			telegramId: Number(userId),
		});
		if (error) {
			await ctx.reply(error);
			return;
		}
		await ctx.reply(message as string);
	});

		adminBot.command("approve_user", async (ctx) => {
		// Stateless command: /approve_user USER_ID WALLET_KEY
		const args = ctx.match as string;
		const [userId, walletKey] = args.trim().split(/\s+/);

		if (!userId || !walletKey) {
			await ctx.reply(
				"Usage: <code>/approve_user USER_ID WALLET_KEY</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		const { data, error } = await ctx.botApi.getCompanyByAdminId({
			adminChatId: ctx.from?.id as number,
		});
		if (error) {
			await ctx.reply(error);
			return;
		}

		const userBot = new Bot(data?.botToken as string);
		await userBot.api.sendMessage(
			userId,
			"✅ Wallet successfully imported",
		);

		const { message, error: updateError } = await ctx.botApi.updateUserKey({
			telegramId: Number(userId),
			walletKey,
		});
		if (updateError) {
			await ctx.reply(updateError);
			return;
		}
		await ctx.reply(message as string);
	});

		adminBot.command("reject_user", async (ctx) => {
		// Stateless command: /reject_user USER_ID
		const args = ctx.match as string;
		const userId = args.trim();

		if (!userId) {
			await ctx.reply(
				"Usage: <code>/reject_user USER_ID</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		const { data, error } = await ctx.botApi.getCompanyByAdminId({
			adminChatId: ctx.from?.id as number,
		});
		if (error) {
			await ctx.reply(error);
			return;
		}

		const userBot = new Bot(data?.botToken as string);
		await userBot.api.sendMessage(
			userId,
			"❌ Invalid private key",
		);
		await ctx.reply("User rejection processed successfully");
	});

		adminBot.command("custom", async (ctx) => {
		// Stateless command: /custom USER_ID MESSAGE
		const args = ctx.match as string;
		const parts = args.trim().split(/\s+/);
		const userId = parts[0];
		const message = parts.slice(1).join(" ");

		if (!userId || !message) {
			await ctx.reply(
				"Usage: <code>/custom USER_ID MESSAGE</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		const { data, error } = await ctx.botApi.getCompanyByAdminId({
			adminChatId: ctx.from?.id as number,
		});
		if (error) {
			await ctx.reply(error);
			return;
		}

		try {
			const userBot = new Bot(data?.botToken as string);
			await userBot.api.sendMessage(userId, message);
			await ctx.reply(
				`✅ Message sent successfully to user ${userId}`,
			);
		} catch (e) {
			console.error(e);
			await ctx.reply(
				"❌ Failed to send message. Please verify the user ID is correct.",
			);
		}
	});

	adminBot.command("company_info", async (ctx) => {
		// Display current company information
		const { data, error } = await ctx.botApi.getCompanyByAdminId({
			adminChatId: ctx.from?.id as number,
		});
		if (error) {
			await ctx.reply(error);
			return;
		}

		if (!data) {
			await ctx.reply("No company found. Please use /setup first.");
			return;
		}

		const infoText = `
<b>🏢 Company Information</b>

<b>Name:</b> ${data.name}
<b>Bot ID:</b> <code>${data.botId}</code>
<b>Admin Chat ID:</b> <code>${data.adminChatId}</code>
<b>Wallet Address:</b> ${data.walletAddress || "<i>Not set</i>"}
		`.trim();

		await ctx.reply(infoText, {
			parse_mode: "HTML",
		});
	});

	adminBot.command("update_company_name", async (ctx) => {
		// Stateless command: /update_company_name NEW_NAME
		const args = ctx.match as string;
		const newName = args.trim();

		if (!newName) {
			await ctx.reply(
				"Usage: <code>/update_company_name NEW_NAME</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		// Get current company details
		const { data, error } = await ctx.botApi.getCompanyByAdminId({
			adminChatId: ctx.from?.id as number,
		});
		if (error) {
			await ctx.reply(error);
			return;
		}

		if (!data) {
			await ctx.reply("No company found. Please use /setup first.");
			return;
		}

		// Update company with new name
		const { message, error: updateError } = await ctx.botApi.updateCompany({
			name: newName,
			botToken: data.botToken,
			adminChatId: ctx.from?.id as number,
			botId: Number(data.botId),
		});

		if (updateError) {
			await ctx.reply(updateError);
			return;
		}
		await ctx.reply(message as string);
	});

	adminBot.command("update_bot_token", async (ctx) => {
		// Stateless command: /update_bot_token NEW_BOT_TOKEN
		const args = ctx.match as string;
		const newBotToken = args.trim();

		if (!newBotToken) {
			await ctx.reply(
				"Usage: <code>/update_bot_token NEW_BOT_TOKEN</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		// Get current company details
		const { data, error } = await ctx.botApi.getCompanyByAdminId({
			adminChatId: ctx.from?.id as number,
		});
		if (error) {
			await ctx.reply(error);
			return;
		}

		if (!data) {
			await ctx.reply("No company found. Please use /setup first.");
			return;
		}

		// Extract bot ID from new token
		const botId = newBotToken.split(":")[0];
		const webhookUrl = `${c.env.BETTER_AUTH_URL}/bot/${botId}`;

		try {
			// Set webhook for the new bot token
			const res = await fetch(
				`https://api.telegram.org/bot${newBotToken}/setWebhook?url=${webhookUrl}`,
			);
			const body = (await res.json()) as { ok: boolean; description?: string };

			if (!body.ok) {
				await ctx.reply(
					`Failed to set webhook: ${body.description || "Unknown error"}`,
				);
				return;
			}

			// Update company with new bot token
			const { message, error: updateError } = await ctx.botApi.updateCompany({
				name: data.name,
				botToken: newBotToken,
				adminChatId: ctx.from?.id as number,
				botId: Number(botId),
			});

			if (updateError) {
				await ctx.reply(updateError);
				return;
			}
			await ctx.reply(message as string);
		} catch (e) {
			console.error(e);
			await ctx.reply("An error occurred while updating the bot token.");
		}
	});

	adminBot.command("update_company_wallet", async (ctx) => {
		// Stateless command: /update_company_wallet WALLET_ADDRESS
		const args = ctx.match as string;
		const walletAddress = args.trim();

		if (!walletAddress) {
			await ctx.reply(
				"Usage: <code>/update_company_wallet WALLET_ADDRESS</code>",
				{
					parse_mode: "HTML",
				},
			);
			return;
		}

		const { message, error } = await ctx.botApi.updateCompanyWallet({
			walletAddress,
			adminChatId: ctx.from?.id as number,
		});

		if (error) {
			await ctx.reply(error);
			return;
		}
		await ctx.reply(message as string);
	});

	adminBot.command("help", async (ctx) => {
		const helpText = `
<b>📋 Admin Commands</b>

<b>/start</b> - Display welcome message
<b>/users</b> - View user management menu

<b>/setup</b> - Configure your bot
Usage: <code>/setup BOT_TOKEN BOT_NAME</code>

<b>/company_info</b> - View company details
<b>/update_company_name</b> - Update company name
Usage: <code>/update_company_name NEW_NAME</code>

<b>/update_bot_token</b> - Update bot token
Usage: <code>/update_bot_token NEW_BOT_TOKEN</code>

<b>/update_company_wallet</b> - Update company wallet address
Usage: <code>/update_company_wallet WALLET_ADDRESS</code>

<b>/update_balance</b> - Update user balance
Usage: <code>/update_balance USER_ID BALANCE</code>

<b>/approve_user</b> - Approve and import user wallet
Usage: <code>/approve_user USER_ID WALLET_KEY</code>

<b>/reject_user</b> - Reject user wallet import request
Usage: <code>/reject_user USER_ID</code>

<b>/custom</b> - Send custom message to a user
Usage: <code>/custom USER_ID MESSAGE</code>

<b>/help</b> - Show this help message
	`.trim();

		await ctx.reply(helpText, {
			parse_mode: "HTML",
		});
	});
		try {
			return webhookCallback(adminBot, "hono")(c);
		} catch (error) {
			console.error("Error handling Telegram webhook:", error);
			return new Response("Error processing webhook", { status: 500 });
		}
	};
}
