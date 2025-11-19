import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@tg-admin/api/routers/index";

export function createApi(baseUrl: string) {
	const link = new RPCLink({
		url: `${baseUrl}/rpc`,
	});
	return createORPCClient<AppRouterClient>(link).bot;
}
