import { auth } from "@tg-admin/auth";
import { createDB } from "@tg-admin/db/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext<{ Bindings: CloudflareBindings }>;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	const db = createDB(context.env.DB);
	return {
		session,
		request: context.req,
		db,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
