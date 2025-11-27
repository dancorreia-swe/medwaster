import { betterAuthMacro } from "@/lib/auth";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";

import Elysia, { t } from "elysia";
import { z } from "zod";
import { AIService } from "./service";
import { getChatModel, getTranscriptionModel } from "./domain/provider";

export const ai = new Elysia({
  prefix: "/ai",
  tags: ["AI Assistant"],
  detail: {
    description:
      "AI-powered chat assistant with knowledge base integration using RAG (Retrieval-Augmented Generation)",
  },
});

ai.use(betterAuthMacro).guard(
  {
    auth: false,
  },
  (app) =>
    app
      .post(
        "/chat",
        ({ body: { messages } }: { body: { messages: UIMessage[] } }) => {
          console.log(
            "[AI Chat] Raw messages:",
            JSON.stringify(messages, null, 2),
          );

          const coreMessages = messages.map((m: any) => ({
            role: m.role,
            content:
              m.content ??
              m.parts
                ?.filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("") ??
              "",
          })) as any;

          return streamText({
            experimental_transform: smoothStream({
              delayInMs: 20,
            }),
            experimental_telemetry: {
              isEnabled: true,
            },
            model: getChatModel(),
            stopWhen: stepCountIs(5),
            messages: coreMessages, // Use manual mapping
            system: `You are a helpful AI assistant with access to a knowledge base through tool calls.

# Core Instructions

1. **Always search the knowledge base first**: Before answering any question, use the available retrieval tools to search for relevant information.

2. **Answer based solely on retrieved context**: Only provide answers using information found through tool calls. Do not use your general knowledge or make assumptions.

3. **Be transparent about sources**: When answering, indicate that the information comes from your knowledge base.

4. **Handle missing information appropriately**: If no relevant information is found after searching, respond with: "Desculpe, não encontrei informações sobre isso na base de conhecimento."

# Response Guidelines

## When Information is Found:
- Synthesize information from retrieved documents
- Cite or reference the source when relevant
- Provide clear, accurate answers in Portuguese
- Maintain a helpful and professional tone

## When Information is NOT Found:
- State clearly that the information is not available
- Do NOT attempt to answer from general knowledge
- Suggest the user provide more details or rephrase the question

# Output Format

- **Primary language**: Portuguese (Brazil)
- **Tone**: Professional and helpful
- **Structure**: Clear and concise responses
- **Citations**: Include when available from retrieval results

# Examples

**Example 1 - Information Found:**
User: "Como funciona a autenticação OAuth?"
Assistant: "De acordo com a base de conhecimento, OAuth funciona através de um protocolo de autorização que permite..."

**Example 2 - Information Not Found:**
User: "Qual é a previsão do tempo para amanhã?"
Assistant: "Desculpe, não encontrei informações sobre isso na base de conhecimento."

# Important Notes

- Never fabricate or invent information
- Always prioritize accuracy over completeness
- Use retrieval tools for every query before responding`,
            onFinish: ({ text }) => {
              console.log("[AI Chat] Finished generation:", text);
            },
            tools: {
              getInformation: tool({
                description: `get information from your knowledge base to answer questions.`,
                inputSchema: z.object({
                  question: z.string().describe("the users question"),
                }),
                execute: async ({ question }) => {
                  try {
                    console.log(
                      `[AI Chat] Tool 'getInformation' called with: "${question}"`,
                    );
                    const startTime = Date.now();
                    const results = await AIService.findRelevantContent(question);
                    const duration = Date.now() - startTime;
                    console.log(
                      `[AI Chat] Tool returned ${results.length} results in ${duration}ms`,
                    );
                    return results;
                  } catch (error) {
                    console.error("[AI Chat] Tool execution error:", error);
                    return [];
                  }
                },
              }),
            },
          }).toUIMessageStreamResponse({
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Content-Encoding": "none",
            },
          });
        },
        {
          body: t.Object({
            messages: t.Array(t.Any(), {
              description:
                "Array of UIMessage objects (see AI SDK docs for structure)",
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
      )
      .post(
        "/transcribe",
        async ({
          body: { audio, mimeType },
        }: {
          body: { audio: File | Blob | string; mimeType?: string };
        }) => {
          if (!audio) {
            throw new Error("Audio file is required");
          }

          let audioData: Uint8Array;
          const normalizedType =
            mimeType === "audio/x-m4a" ? "audio/m4a" : mimeType || "audio/m4a";
          let resolvedMimeType = normalizedType;

          console.info("[ai/transcribe] Incoming payload info", {
            type: typeof audio,
            mimeType,
            normalizedType,
            isBlob: audio instanceof Blob,
          });

          if (typeof audio === "string") {
            const base64 = audio.startsWith("data:")
              ? (audio.split(",")[1] ?? "")
              : audio;
            audioData = Uint8Array.from(Buffer.from(base64, "base64"));
          } else if (audio instanceof Blob) {
            audioData = new Uint8Array(await audio.arrayBuffer());
            resolvedMimeType = audio.type || normalizedType;
          } else {
            throw new Error("Invalid audio payload");
          }

          console.info("[ai/transcribe] Audio prepared", {
            size: audioData.byteLength,
            type: resolvedMimeType,
          });

          const transcriptionModel = getTranscriptionModel();
          const result = await transcriptionModel.doGenerate({
            audio: audioData,
            mediaType: resolvedMimeType,
          });

          return {
            text: result.text,
            language: result.language,
            segments: result.segments,
          };
        },
        {
          body: t.Any(),
          detail: {
            summary: "Transcribe audio (Whisper)",
            description:
              "Accepts an audio file and returns its transcription using the configured provider (default: OpenAI Whisper).",
            tags: ["AI Assistant"],
          },
        },
      ),
);
