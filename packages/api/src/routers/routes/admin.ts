import { getAll } from "@tg-admin/db/queries/admin";
import { protectedProcedure } from "../..";

export const adminRouter = {
	getAll: protectedProcedure.handler(async () => {
		return await getAll();
	}),
};
