import { describe, expect, it, vi } from "vitest";

import { rss202608Content } from "./rss-2026-08-content";
import {
  enqueueEmbeddings,
  runImport,
  resolveTrailContentId,
  safeError,
  validateImportFlags,
  validateManifest,
} from "./rss-2026-08-import";

vi.mock("../../lib/queue", () => ({
  ragQueue: {
    add: vi.fn(),
    close: vi.fn(),
  },
}));

describe("RSS 2026-08 content import", () => {
  it("validates the approved counts and reference article mapping", () => {
    const manifest = validateManifest(rss202608Content);

    expect(manifest.batchKey).toBe("rss-doc-2026-08");
    expect(manifest.articles).toHaveLength(8);
    expect(manifest.questions).toHaveLength(46);
    expect(manifest.quizzes).toHaveLength(5);
    expect(manifest.trails).toHaveLength(1);
    expect(manifest.articles[5]?.sourceKey).toBe("rss-2026-08-trilha-reference");
    expect(manifest.articles[0]?.readingTimeMinutes).toBeGreaterThan(0);
    expect(manifest.trails[0]?.content[9]).toMatchObject({
      type: "article",
      sourceKey: "rss-2026-08-trilha-reference",
      sequence: 10,
    });
  });

  it("rejects duplicate slugs and invalid multiple-choice data", () => {
    const duplicateSlug = structuredClone(rss202608Content) as any;
    duplicateSlug.articles[1].slug = duplicateSlug.articles[0].slug;
    expect(() => validateManifest(duplicateSlug)).toThrow(/duplicate/i);

    const invalidOptions = structuredClone(rss202608Content) as any;
    invalidOptions.questions[0].options[1].isCorrect = true;
    expect(() => validateManifest(invalidOptions)).toThrow(/exactly one correct/i);
  });

  it("never combines apply and publish", async () => {
    await expect(
      runImport(
        {
          DATABASE_URL: "postgresql://test",
          CONTENT_IMPORT_AUTHOR_ID: "test-author",
          CONTENT_IMPORT_APPLY: "1",
          CONTENT_IMPORT_PUBLISH: "1",
        },
        rss202608Content,
      ),
    ).rejects.toThrow(/cannot be used together/i);
  });

  it("requires an expected hash for the separate publish phase", async () => {
    await expect(
      runImport(
        {
          DATABASE_URL: "postgresql://test",
          CONTENT_IMPORT_AUTHOR_ID: "test-author",
          CONTENT_IMPORT_PUBLISH: "1",
          CONTENT_IMPORT_ENQUEUE_EMBEDDINGS: "1",
        },
        rss202608Content,
      ),
    ).rejects.toThrow(/EXPECTED_SHA256.*required/i);
  });

  it("requires embedding enqueueing for every publish run", () => {
    expect(() =>
      validateImportFlags({ CONTENT_IMPORT_PUBLISH: "1" }),
    ).toThrow(/CONTENT_IMPORT_ENQUEUE_EMBEDDINGS=1/);
    expect(
      validateImportFlags({
        CONTENT_IMPORT_PUBLISH: "1",
        CONTENT_IMPORT_ENQUEUE_EMBEDDINGS: "1",
      }),
    ).toMatchObject({ publish: true, enqueueEmbeddings: true });
  });

  it("throws a non-success error with the remaining article IDs when enqueueing fails", async () => {
    const manifest = validateManifest(rss202608Content);
    const { ragQueue } = await import("../../lib/queue");
    const queue = ragQueue as any;
    queue.add.mockReset();
    queue.close.mockReset();
    queue.add.mockResolvedValueOnce({});
    queue.add.mockRejectedValueOnce(new Error("Redis unavailable"));
    queue.close.mockResolvedValue(undefined);

    const phase = {
      ids: {
        articles: Object.fromEntries(
          manifest.articles.map((article, index) => [article.sourceKey, index + 100]),
        ),
      },
    } as any;

    const error = await enqueueEmbeddings(
      { CONTENT_IMPORT_ENQUEUE_EMBEDDINGS: "1" },
      manifest,
      phase,
    ).catch((failure: unknown) => failure as Error);

    expect(error).toBeInstanceOf(Error);
    if (!(error instanceof Error)) {
      throw new Error("Expected enqueueEmbeddings to reject with an Error");
    }
    expect(error.message).toMatch(/Embedding enqueue failed after the publish transaction committed/i);
    expect(error.message).toContain("101 (rss-2026-08-article-02)");
    expect(error.message).toContain("107 (rss-2026-08-article-07)");
    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(queue.close).toHaveBeenCalledTimes(1);
  });

  it("preserves AggregateError and non-Error details in the CLI failure message", () => {
    const message = safeError(
      new AggregateError([
        {
          code: "ECONNREFUSED",
          address: "127.0.0.1",
          port: 55432,
          detail: "staging database unavailable",
        },
        new Error("connection retry exhausted"),
      ]),
    );

    expect(message).toContain("AggregateError");
    expect(message).toContain("code=ECONNREFUSED");
    expect(message).toContain("address=127.0.0.1");
    expect(message).toContain("port=55432");
    expect(message).toContain("detail=staging database unavailable");
    expect(message).toContain("Error: connection retry exhausted");
  });

  it("resolves quiz trail content against the quizzes ID map", () => {
    expect(
      resolveTrailContentId(
        {
          articles: {},
          questions: {},
          quizzes: { "rss-2026-08-quiz-01": 42 },
        },
        { type: "quiz", sourceKey: "rss-2026-08-quiz-01" },
      ),
    ).toBe(42);
  });
});
