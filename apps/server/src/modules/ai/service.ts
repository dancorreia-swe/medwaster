import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { embed, embedMany } from "ai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "@/db/schema/embeddings";
import { db } from "@/db";
import { getEmbeddingModel } from "./domain/provider";

export abstract class AIService {
  private static embeddingModel = getEmbeddingModel();

  static async generateEmbeddings(
    content: string,
  ): Promise<{ content: string; embedding: number[] }[]> {
    const embeddingModel = this.embeddingModel;

    // Use RecursiveCharacterTextSplitter for better handling of both HTML and PDF content
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
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

  static async generateEmbedding(value: string): Promise<number[]> {
    const input = value.replaceAll("\\n", " ");

    const { embedding } = await embed({
      model: this.embeddingModel,
      value: input,
    });

    return embedding;
  }

  static async findRelevantContent(userQuery: string) {
    const userQueryEmbedded = await AIService.generateEmbedding(userQuery);

    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      userQueryEmbedded,
    )})`;

    const similarGuides = await db
      .select({ name: embeddings.content, similarity })
      .from(embeddings)
      .where(gt(similarity, 0.5))
      .orderBy((t) => desc(t.similarity))
      .limit(5);

    return similarGuides;
  }
}
