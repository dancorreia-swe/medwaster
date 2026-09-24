import { beforeEach, describe, expect, it, vi } from "vitest";
import * as drizzleOrm from "drizzle-orm";
import * as schema from "@/db/schema/questions";
import type { CreateTagBody } from "@/modules/tags/model";

/**
 * These tests previously asserted an older TagsService: `db.select()` for
 * getAll and `tagsInsertSchema.parse` for createTag. The service now reads
 * through the relational API (`db.query.tags.findMany`) and validates with
 * `Value.Parse`, so the expectations are written against that.
 */

// The service reaches for db.query.tags.findMany, db.select and db.insert.
// A plain object covers all three; the previous `drizzle.mock({ schema })`
// stood up a real driver, and `pg` is not resolvable from the test runtime.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: { tags: { findMany: vi.fn() } },
    select: () => undefined,
    insert: () => undefined,
  },
}));

vi.mock("@/db", () => ({ db: mockDb }));

// Re-export drizzle-orm through a fresh object: a real ES module namespace is
// frozen, so vi.spyOn cannot redefine `ilike`/`or` on it.
vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
}));

import { TagsService } from "@/modules/tags/service";

// `randomColor` is private; the tests drive it deliberately. Named rather than
// asserted inline so the reason for reaching past the visibility is explicit.
const serviceInternals = TagsService as unknown as {
  randomColor: () => { hex: () => string };
};

function tagRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Safety",
    slug: "safety",
    color: "#ff0000",
    questionTags: [],
    wikiArticleTags: [],
    quizTags: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockDb.query.tags.findMany.mockReset();
  mockDb.query.tags.findMany.mockResolvedValue([]);
});

describe("TagsService.getAll", () => {
  it("flattens the junction tables onto each tag", async () => {
    mockDb.query.tags.findMany.mockResolvedValue([
      tagRow({
        questionTags: [{ question: { id: 10, status: "active" } }],
        wikiArticleTags: [{ article: { id: 20, status: "published" } }],
        quizTags: [{ quiz: { id: 30, status: "active" } }],
      }),
    ]);

    const [tag] = await TagsService.getAll();

    expect(tag.questions).toEqual([{ id: 10, status: "active" }]);
    expect(tag.wikiArticles).toEqual([{ id: 20, status: "published" }]);
    expect(tag.quizzes).toEqual([{ id: 30, status: "active" }]);
  });

  it("hides archived related content", async () => {
    mockDb.query.tags.findMany.mockResolvedValue([
      tagRow({
        questionTags: [
          { question: { id: 10, status: "archived" } },
          { question: { id: 11, status: "active" } },
        ],
        wikiArticleTags: [{ article: { id: 20, status: "archived" } }],
        quizTags: [{ quiz: { id: 30, status: "archived" } }],
      }),
    ]);

    const [tag] = await TagsService.getAll();

    expect(tag.questions).toEqual([{ id: 11, status: "active" }]);
    expect(tag.wikiArticles).toEqual([]);
    expect(tag.quizzes).toEqual([]);
  });

  it("applies no filter when there is no search term", async () => {
    await TagsService.getAll();
    expect(mockDb.query.tags.findMany.mock.calls[0][0].where).toBeUndefined();

    await TagsService.getAll({ search: "   " });
    expect(mockDb.query.tags.findMany.mock.calls[1][0].where).toBeUndefined();
  });

  it("searches name and slug by default", async () => {
    const ilikeSpy = vi.spyOn(drizzleOrm, "ilike");
    const orSpy = vi.spyOn(drizzleOrm, "or");

    await TagsService.getAll({ search: "haz" });

    expect(ilikeSpy).toHaveBeenCalledWith(schema.tags.name, "%haz%");
    expect(ilikeSpy).toHaveBeenCalledWith(schema.tags.slug, "%haz%");
    expect(orSpy).toHaveBeenCalledTimes(1);
    expect(mockDb.query.tags.findMany.mock.calls[0][0].where).toBe(
      orSpy.mock.results[0]?.value,
    );
  });

  it("uses a single condition, not OR, when one key is requested", async () => {
    const ilikeSpy = vi.spyOn(drizzleOrm, "ilike");
    const orSpy = vi.spyOn(drizzleOrm, "or");

    await TagsService.getAll({ search: "haz", keys: ["slug"] });

    expect(ilikeSpy).toHaveBeenCalledTimes(1);
    expect(ilikeSpy).toHaveBeenCalledWith(schema.tags.slug, "%haz%");
    expect(orSpy).not.toHaveBeenCalled();
    expect(mockDb.query.tags.findMany.mock.calls[0][0].where).toBe(
      ilikeSpy.mock.results[0]?.value,
    );
  });

  // `%` is a LIKE wildcard; leaving it in would let a search term widen its
  // own pattern.
  it("strips wildcards out of the search term", async () => {
    const ilikeSpy = vi.spyOn(drizzleOrm, "ilike");

    await TagsService.getAll({ search: "%haz%", keys: ["name"] });

    expect(ilikeSpy).toHaveBeenCalledWith(schema.tags.name, "%haz%");
  });
});

describe("TagsService.getByName", () => {
  it("filters on the exact name", async () => {
    const expected = [{ id: 3, name: "Hazardous", slug: "hazardous" }];
    const executeMock = vi.fn().mockResolvedValue(expected);
    const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    const selectSpy = vi
      .spyOn(mockDb, "select")
      .mockReturnValue({ from: fromMock } as never);

    const eqSpy = vi.spyOn(drizzleOrm, "eq");

    const result = await TagsService.getByName("Hazardous");

    expect(selectSpy).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(schema.tags);
    expect(eqSpy).toHaveBeenCalledWith(schema.tags.name, "Hazardous");
    expect(whereMock).toHaveBeenCalledWith(eqSpy.mock.results[0]?.value);
    expect(result).toEqual(expected);
  });
});

describe("TagsService.createTag", () => {
  function stubInsert(rows: unknown[]) {
    const returningMock = vi.fn().mockResolvedValue(rows);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    vi.spyOn(mockDb, "insert").mockReturnValue({
      values: valuesMock,
    } as never);
    return { valuesMock, returningMock };
  }

  it("keeps a caller-supplied colour", async () => {
    const payload: CreateTagBody = {
      name: "Composting",
      slug: "composting",
      color: "#123456",
      description: "Organic waste",
    };
    const { valuesMock } = stubInsert([{ id: 4, ...payload }]);
    const randomColorSpy = vi.spyOn(serviceInternals, "randomColor");

    const result = await TagsService.createTag({ ...payload });

    expect(randomColorSpy).not.toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining(payload));
    expect(result).toEqual({ id: 4, ...payload });
  });

  it("generates a colour when none is supplied", async () => {
    const payload = {
      name: "Sharps",
      slug: "sharps",
      description: "Needle disposal",
    } as CreateTagBody;
    const generated = "#abcdef";
    const { valuesMock } = stubInsert([{ id: 5, ...payload, color: generated }]);

    const hex = vi.fn().mockReturnValue(generated);
    const randomColorSpy = vi
      .spyOn(serviceInternals, "randomColor")
      .mockReturnValue({ hex });

    await TagsService.createTag(payload);

    expect(randomColorSpy).toHaveBeenCalledTimes(1);
    expect(hex).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Sharps",
        slug: "sharps",
        color: generated,
      }),
    );
  });

  it("returns the first inserted row", async () => {
    stubInsert([{ id: 6, name: "A" }, { id: 7, name: "B" }]);
    vi.spyOn(serviceInternals, "randomColor").mockReturnValue({
      hex: () => "#000000",
    });

    const result = await TagsService.createTag({
      name: "A",
      slug: "a",
    } as CreateTagBody);

    expect(result).toEqual({ id: 6, name: "A" });
  });
});
