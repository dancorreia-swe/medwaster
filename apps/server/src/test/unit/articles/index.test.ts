import { describe, expect, it } from "bun:test";
import { app } from "@/index";
import { treaty } from "@elysiajs/eden";
import { articleDetailSchema } from "@/modules/wiki/types/article";

const api = treaty(app);

describe("Articles API", () => {
  it("should return the created embeddings", async () => {
    const { data } = await api.wiki.articles.post({
      title: "Test Article",
      content: "This is a test article.",
      contentText:
        "This is a super mega text to make the AI read to generate embeddings",
      excerpt: "Super nice article",
      status: "published",
    });

  });
});
