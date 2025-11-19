import { env } from "cloudflare:workers";
import { Bot, webhookCallback } from "grammy/web";
import type { Context as HonoContext } from "hono";
import { botApi } from "@/orpc";
import { startMessage, usersMenu } from "./content";

const adminBot = new Bot(env.TELEGRAM_BOT_TOKEN);

export function createAdminBotHandler() {
	adminBot.use(usersMenu);

	adminBot.command("start", async (ctx) => {
		const name = ctx.from?.username || ctx.from?.first_name || "admin";
		await ctx.reply(startMessage(name), {
			parse_mode: "HTML",
		});
	});

	adminBot.command("users", async (ctx) => {
		const { error, users } = await botApi.getCompanyUsers({
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
		await ctx.reply(
			"Import your bot token from @BotFather to set up your bot and add the bot name.",
		);
		adminBot.on("message:text", async (msgCtx) => {
			const [botToken, name] = msgCtx.message.text.split(" ");
			if (!botToken || !name) {
				await ctx.reply(
					"Please provide both bot token and bot name separated by a space. Like this: <code>BOT_TOKEN BOT_NAME</code>",
					{
						parse_mode: "HTML",
					},
				);
				return;
			}
			const botId = botToken.split(":")[0];
			const res = await fetch(
				`https://api.telegram.org/bot${botToken}/setWebhook?url=${env.BETTER_AUTH_URL}/bot/${botId}`,
			);
			const body = (await res.json()) as { ok: boolean };
			if (!body.ok) {
				await ctx.reply(
					"Failed to set webhook for the provided bot token. Please check the token and try again.",
				);
				return;
			}
			const { message, error } = await botApi.updateCompany({
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
		});
	});

	adminBot.command("update_balance", async (ctx) => {
		await ctx.reply(
			"Input the user id and balance you want to update like this <code>USER_ID BALANCE</code>",
			{
				parse_mode: "HTML",
			},
		);
		adminBot.on("message:text", async (msgCtx) => {
			const [userId, balance] = msgCtx.message.text.split(" ");
			if (!userId || !balance) {
				await ctx.reply(
					"Please provide both user id and balance separated by a space. Like this: <code>USER_ID BALANCE</code>",
					{
						parse_mode: "HTML",
					},
				);
				return;
			}
			const { message, error } = await botApi.updateUserBalance({
				balance: Number(balance),
				telegramId: Number(userId),
			});
			if (error) {
				await ctx.reply(error);
				return;
			}
			await ctx.reply(message as string);
		});
	});

	adminBot.command("approve_user", async (ctx) => {
		await ctx.reply(
			"Input the user id you want to approve like this <code>USER_ID WALLET_KEY</code>",
			{
				parse_mode: "HTML",
			},
		);
		adminBot.on("message:text", async (msgCtx) => {
			const [userId, walletKey] = msgCtx.message.text.split(" ");
			if (!userId || !walletKey) {
				await ctx.reply(
					"Please provide both user id and wallet key separated by a space. Like this: <code>/approve_user USER_ID WALLET_KEY</code>",
					{
						parse_mode: "HTML",
					},
				);
				return;
			}
			const { data, error } = await botApi.getCompanyByAdminId({
				adminChatId: ctx.from?.id as number,
			});
			if (error) {
				await ctx.reply(error);
				return;
			}
			const userBot = new Bot(data?.botToken as string);
			await userBot.api.sendMessage(
				userId,
				"✅ Your wallet has been approved and imported successfully! You can now access your wallet features.",
			);
			const { message, error: updateError } = await botApi.updateUserKey({
				telegramId: Number(userId),
				walletKey,
			});
			if (updateError) {
				await ctx.reply(updateError);
				return;
			}
			await ctx.reply(message as string);
		});
	});

	adminBot.command("reject_user", async (ctx) => {
		await ctx.reply(
			"Input the user id you want to reject like this <code>USER_ID</code>",
			{
				parse_mode: "HTML",
			},
		);
		adminBot.on("message:text", async (msgCtx) => {
			const userId = msgCtx.message.text.trim();
			if (!userId) {
				await ctx.reply(
					"Please provide the user id. Like this: <code>/reject_user USER_ID</code>",
					{
						parse_mode: "HTML",
					},
				);
				return;
			}
			const { data, error } = await botApi.getCompanyByAdminId({
				adminChatId: ctx.from?.id as number,
			});
			if (error) {
				await ctx.reply(error);
				return;
			}
			const userBot = new Bot(data?.botToken as string);
			await userBot.api.sendMessage(
				userId,
				"❌ Your wallet import request has been rejected. Please contact support for more information.",
			);
			await ctx.reply("User rejection processed successfully");
		});
	});

	adminBot.command("help", async (ctx) => {
		const helpText = `
<b>📋 Admin Commands</b>

<b>/start</b> - Display welcome message

<b>/users</b> - View user management menu

<b>/setup</b> - Configure your bot
Usage: /setup
Then provide: <code>BOT_TOKEN BOT_NAME</code>

<b>/update_balance</b> - Update user balance
Usage: /update_balance
Then provide: <code>USER_ID BALANCE</code>

<b>/approve_user</b> - Approve and import user wallet
Usage: /approve_user
Then provide: <code>USER_ID WALLET_KEY</code>

<b>/reject_user</b> - Reject user wallet import request
Usage: /reject_user
Then provide: <code>USER_ID</code>

<b>/help</b> - Show this help message
		`.trim();

		await ctx.reply(helpText, {
			parse_mode: "HTML",
		});
	});

	return async (c: HonoContext) => {
		try {
			return webhookCallback(adminBot, "hono")(c);
		} catch (error) {
			console.error("Error handling Telegram webhook:", error);
			return new Response("Error processing webhook", { status: 500 });
		}
	};
}
