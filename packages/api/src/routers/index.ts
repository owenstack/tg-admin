import type { RouterClient } from "@orpc/server";
import { adminRouter } from "./routes/admin";
import { botRouter } from "./routes/bot";
import { miscellaneousRouter } from "./routes/miscellaneous";

export const appRouter = {
	miscellaneous: miscellaneousRouter,
	bot: botRouter,
	admin: adminRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
