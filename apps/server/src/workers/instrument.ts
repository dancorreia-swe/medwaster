// Imported first by src/workers/index.ts so Sentry initialises before any other module.
import "dotenv/config";
import { initSentry } from "@/lib/sentry";

initSentry("worker");
