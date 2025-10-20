import { betterAuthMacro } from "@/lib/auth";
import {
  convertToModelMessages,
  smoothStream,
  streamText,
  tool,
  type UIMessage,
} from "ai";
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
      ({ body: { messages } }) =>
        streamText({
          experimental_transform: smoothStream({
            delayInMs: 20,
          }),
          model: openai("gpt-5-nano"),
          maxRetries: 3,
          messages: convertToModelMessages(messages as UIMessage[]),
          system:
            "You're a specialist about medical information and pill disposition.",
          tools: {
            rag: tool({
              description:
                "Get and retrieve relevant information from your knowledge base/wiki.",
              inputSchema: z.object({
                question: z.string().describe("The question to search for"),
              }),
            }),
          },
        }).toUIMessageStreamResponse({
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "none",
          },
        }),
      {
        body: t.Object({
          messages: t.Any(),
        }),
      },
    ),
);
