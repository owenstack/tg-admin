import { env } from "cloudflare:workers";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@tg-admin/api/routers/index";

export const link = new RPCLink({
	url: `${env.BETTER_AUTH_URL}/rpc`,
});

export const botApi: AppRouterClient["bot"] =
	createORPCClient<AppRouterClient>(link).bot;
