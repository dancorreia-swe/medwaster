import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	// Read WEB_PORT from .env so parallel worktrees can each serve on their own
	// port. loadEnv with an empty prefix is required: vite only exposes VITE_*
	// to process.env, and this is a server setting rather than client code.
	const env = loadEnv(mode, __dirname, "");

	// Source maps are only built and uploaded when a Sentry auth token is
	// present (CI/Docker build). Without one the build is unchanged. Maps are
	// "hidden" (no sourceMappingURL) and deleted after upload, so they're
	// never served publicly.
	const sentryAuthToken = env.SENTRY_AUTH_TOKEN;
	const uploadSourceMaps = Boolean(
		sentryAuthToken && env.SENTRY_ORG && env.SENTRY_PROJECT,
	);

	return {
		plugins: [
			tailwindcss(),
			tanstackRouter({}),
			react(),
			// Must stay last.
			uploadSourceMaps &&
				sentryVitePlugin({
					org: env.SENTRY_ORG,
					project: env.SENTRY_PROJECT,
					authToken: sentryAuthToken,
					release: { name: env.VITE_SENTRY_RELEASE || undefined },
					sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
					telemetry: false,
				}),
		],
		build: {
			sourcemap: uploadSourceMaps ? "hidden" : false,
		},
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
