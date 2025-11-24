import { env } from "cloudflare:workers";
import { db } from "@tg-admin/db/db";
import * as schema from "@tg-admin/db/schema/auth";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema,
	}),
	trustedOrigins: [env.CORS_ORIGIN],
	emailAndPassword: {
		enabled: true,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60,
		},
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== "/sign-up/email" && ctx.path !== "/sign-in/email") {
				return;
			}
			if (!ctx.body?.email.endsWith("@efobi.dev")) {
				throw new APIError("BAD_REQUEST", {
					message: "Email domain is not allowed.",
				});
			}
		}),
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	advanced: {
		defaultCookieAttributes: {
			sameSite: env.BETTER_AUTH_URL.startsWith("https://") ? "none" : "lax",
			secure: env.BETTER_AUTH_URL.startsWith("https://"),
			httpOnly: true,
		},
		// uncomment crossSubDomainCookies setting when ready to deploy and replace <your-workers-subdomain> with your actual workers subdomain
		// https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
		crossSubDomainCookies: {
			enabled: env.BETTER_AUTH_URL.startsWith("https://"),
			domain: env.BETTER_AUTH_URL,
		},
	},
});
