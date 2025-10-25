import { betterAuthMacro } from "@/lib/auth";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";

import Elysia, { t } from "elysia";
import { z } from "zod";
import { AIService } from "./service";

export const ai = new Elysia({
  prefix: "/ai",
  tags: ["AI Assistant"],
  detail: {
    description:
      "AI-powered chat assistant with knowledge base integration using RAG (Retrieval-Augmented Generation)",
  },
})
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
    },
    (app) =>
      app.post(
        "/chat",
        ({ body: { messages } }: { body: { messages: UIMessage[] } }) =>
          streamText({
            experimental_transform: smoothStream({
              delayInMs: 20,
            }),
            experimental_telemetry: {
              isEnabled: true,
            },
            model: openai("gpt-4o"),
            stopWhen: stepCountIs(5),
            messages: convertToModelMessages(messages),
            system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls. Your main language is Portuguese.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
            tools: {
              getInformation: tool({
                description: `get information from your knowledge base to answer questions.`,
                inputSchema: z.object({
                  question: z.string().describe("the users question"),
                }),
                execute: async ({ question }) =>
                  AIService.findRelevantContent(question),
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
            messages: t.Array(t.Any(), {
              description: "Array of UIMessage objects (see AI SDK docs for structure)",
              minItems: 1,
            }),
          }),
          detail: {
            summary: "Chat with AI assistant",
            description:
              "Stream responses from the AI assistant. The assistant uses RAG to search the knowledge base and provide accurate answers based on wiki articles. Responses are streamed in real-time for better UX. Primary language is Portuguese.",
            tags: ["AI Assistant"],
          },
        },
      ),
  );
