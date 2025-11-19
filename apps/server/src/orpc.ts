import { env } from "cloudflare:workers";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@tg-admin/api/routers/index";

export const link = new RPCLink({
	url: `${env.BETTER_AUTH_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			headers: {
				...(options as RequestInit).headers,
				"x-telegram-bot-token": env.TELEGRAM_BOT_TOKEN,
			},
		});
	},
});

export const botApi: AppRouterClient["bot"] =
	createORPCClient<AppRouterClient>(link).bot;
