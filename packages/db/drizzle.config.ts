import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const envPath = path.resolve("../../apps/server/.env");
dotenv.config({
	path: envPath,
});

function getLocalD1DB() {
	try {
		const basePath = path.resolve(path.dirname(envPath), ".wrangler");
		const dbFile = fs
			.readdirSync(basePath, { encoding: "utf-8", recursive: true })
			.find((f) => f.endsWith(".sqlite"));

		if (!dbFile) {
			throw new Error(`.sqlite file not found in ${basePath}`);
		}

		const filePath = path.resolve(basePath, dbFile);
		const url = `file:///${filePath.replace(/\\/g, "/")}`;
		return url;
	} catch (err) {
		console.log(`Error  ${err}`);
		process.exit(1);
	}
}

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/schema/index.ts",
	out: "./migrations",
	...(process.env.NODE_ENV === "production"
		? {
				driver: "d1-http",
				dbCredentials: {
					accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
					databaseId: process.env.DB,
					token: process.env.CLOUDFLARE_D1_API_TOKEN,
				},
			}
		: {
				dbCredentials: {
					url: getLocalD1DB(),
				},
			}),
});
