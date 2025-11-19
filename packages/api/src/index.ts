import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

const botMiddleware = o.middleware(async ({ context, next }) => {
	const botToken = context.request.raw.headers.get("x-telegram-bot-token");

	if (!botToken || botToken !== context.env.TELEGRAM_BOT_TOKEN) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Invalid or missing Telegram bot token",
		});
	}

	return next({
		context,
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);
export const botProcedure = publicProcedure.use(botMiddleware);
