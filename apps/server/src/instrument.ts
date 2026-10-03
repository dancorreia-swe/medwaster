// Imported first by src/index.ts so Sentry initialises before any other module.
import { initSentry } from "./lib/sentry";

initSentry("api");
