import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

export abstract class AIService {
  static async generateEmbeddings(
    content: string,
  ): Promise<{ content: string; embedding: number[] }[]> {
    const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 50,
      chunkOverlap: 1,
      separators: ["|", "##", ">", "-"],
    });

    const docOutputs = await splitter.splitDocuments([
      new Document({ pageContent: content }),
    ]);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: docOutputs.map((doc) => doc.pageContent),
    });

    return embeddings.map((embedding, idx) => ({
      content: docOutputs[idx].pageContent,
      embedding,
    }));
  }
}
