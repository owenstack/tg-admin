import fs from "node:fs";
import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { parse as parseJsonc } from "jsonc-parser";
import { defineConfig } from "vite";

const wranglerConfig = parseJsonc(
	fs.readFileSync(path.resolve(__dirname, "wrangler.jsonc"), "utf-8"),
);

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), tanstackRouter({}), react(), cloudflare()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	define:
		mode === "production"
			? {
					"import.meta.env.VITE_SERVER_URL": JSON.stringify(
						wranglerConfig.vars.VITE_SERVER_URL,
					),
				}
			: {},
}));
