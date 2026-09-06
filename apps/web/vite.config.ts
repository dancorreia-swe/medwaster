import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	// Read WEB_PORT from .env so parallel worktrees can each serve on their own
	// port. loadEnv with an empty prefix is required: vite only exposes VITE_*
	// to process.env, and this is a server setting rather than client code.
	const env = loadEnv(mode, __dirname, "");

	return {
		plugins: [tailwindcss(), tanstackRouter({}), react()],
		server: {
			port: Number(env.WEB_PORT) || 3001,
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	};
});
