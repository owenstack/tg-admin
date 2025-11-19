import type { RouterClient } from "@orpc/server";
import { miscellaneousRouter } from "./routes/miscellaneous";
import { botRouter } from "./routes/bot";

export const appRouter = {
	miscellaneous: miscellaneousRouter,
	bot: botRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
