import { env } from "cloudflare:workers";
import { Bot, webhookCallback } from "grammy/web";
import type { Context as HonoContext } from "hono";
import { mainMenu, message, walletMenu } from "./content";

const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

mainMenu.register(walletMenu);
bot.use(mainMenu);

bot.command("start", async (ctx) => {
	const name = ctx.from?.username || ctx.from?.first_name || "user";
	await ctx.reply(message(name), {
		parse_mode: "HTML",
		reply_markup: mainMenu,
	});
});

export function createBotHandler() {
	return async (c: HonoContext) => {
		try {
			return webhookCallback(bot, "hono")(c);
		} catch (error) {
			console.error("Error handling Telegram webhook:", error);
			return new Response("Error processing webhook", { status: 500 });
		}
	};
}
