import type { AppRouterClient } from "@tg-admin/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

export const link = new RPCLink({
	url: "http://localhost:3000/rpc",
	fetch(url, options) {
		return fetch(url, {
			...options,
			headers: {
				...(options as RequestInit).headers,
				"x-telegram-bot-token": process.env.TELEGRAM_BOT_TOKEN || "",
			},
		});
	},
});

export const botApi: AppRouterClient["bot"] =
	createORPCClient<AppRouterClient>(link).bot;
