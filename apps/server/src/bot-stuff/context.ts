import type { AppRouterClient } from "@tg-admin/api/routers/index";
import type { Context } from "grammy/web";

export type BotContext = Context & {
	botApi: AppRouterClient["bot"];
};
