import { betterAuthMacro } from "@/lib/auth";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";

import Elysia, { t } from "elysia";
import { z } from "zod";

export const ai = new Elysia({ prefix: "/ai" }).use(betterAuthMacro).guard(
  {
    auth: false,
  },
  (app) =>
    app.post(
      "/chat",
      ({ body }) =>
        streamText({
          model: openai("gpt-5-nano"),
          maxRetries: 3,
          temperature: 0.3,
          system:
            "You're a specialist about medical information and pill disposition.",
          prompt: body,
          tools: {
            rag: tool({
              description:
                "Get and retrieve relevant information from your knowledge base/wiki.",
              inputSchema: z.object({
                question: z.string().describe("The question to search for"),
              }),
            }),
          },
        }).textStream,
      {
        body: t.String(),
      },
    ),
);
