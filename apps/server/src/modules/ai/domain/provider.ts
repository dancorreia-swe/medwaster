import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createProviderRegistry } from "ai";

const PROVIDERS = ["openai", "localai"] as const;
type ProviderName = (typeof PROVIDERS)[number];

const requestedProvider = (process.env.AI_PROVIDER || "openai").toLowerCase();
const defaultProvider: ProviderName = PROVIDERS.includes(
  requestedProvider as ProviderName,
)
  ? (requestedProvider as ProviderName)
  : "openai";

if (!PROVIDERS.includes(requestedProvider as ProviderName)) {
  console.warn(
    `[AI] Unknown AI_PROVIDER "${requestedProvider}". Falling back to OpenAI.`,
  );
}

const registry = createProviderRegistry({
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  localai: createOpenAICompatible({
    name: "localai",
    baseURL: process.env.LOCALAI_BASE_URL || "http://localhost:8080/v1",
    apiKey: process.env.LOCALAI_API_KEY,
  }),
});

const defaultChatModel = process.env.AI_CHAT_MODEL || "gpt-4o";
const defaultEmbeddingModel =
  process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small";

type QualifiedModelId = `openai:${string}` | `localai:${string}`;

const qualifyModel = (modelId: string): QualifiedModelId => {
  if (modelId.includes(":")) {
    return modelId as QualifiedModelId;
  }

  return `${defaultProvider}:${modelId}` as QualifiedModelId;
};

export const getChatModel = (modelId: string = defaultChatModel) => {
  return registry.languageModel(qualifyModel(modelId));
};

export const getEmbeddingModel = (modelId: string = defaultEmbeddingModel) => {
  return registry.textEmbeddingModel(qualifyModel(modelId));
};

export const getCurrentProvider = (): ProviderName => defaultProvider;

const defaultTranscriptionModel =
  process.env.AI_TRANSCRIPTION_MODEL || "whisper-1";

export const getTranscriptionModel = (
  modelId: string = defaultTranscriptionModel,
) => {
  return registry.transcriptionModel(qualifyModel(modelId));
};
