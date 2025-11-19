import type { RouterClient } from "@orpc/server";
import { botRouter } from "./routes/bot";
import { miscellaneousRouter } from "./routes/miscellaneous";

export const appRouter = {
	miscellaneous: miscellaneousRouter,
	bot: botRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
