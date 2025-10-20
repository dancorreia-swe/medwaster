import { TagsService } from "@/modules/tags/service";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  vi,
} from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import type { CreateTagBody } from "@/modules/tags/model";
import * as schema from "@/db/schema/questions";
import * as drizzleOrm from "drizzle-orm";
import type { tagsInsertSchema } from "@/db/schema/questions";

const mockDb = drizzle.mock({ schema });

mock.module("@/db", () => ({
  db: mockDb,
}));

let parseMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  parseMock = vi.fn((input) => input);
  (schema.tagsInsertSchema as any).parse = parseMock;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (schema.tagsInsertSchema as any).parse;
});

describe("Tags Service", () => {
  it("returns all tags from the database", async () => {
    const sampleTags = [
      { id: 1, name: "Safety", slug: "safety", color: "#ff0000" },
      { id: 2, name: "Recycling", slug: "recycling", color: "#00ff00" },
    ];

    const fromMock = vi.fn().mockResolvedValue(sampleTags);
    vi.spyOn(mockDb, "select").mockReturnValue({ from: fromMock } as any);

    const result = await TagsService.getAll();

    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(schema.tags);
    expect(result).toEqual(sampleTags);
  });

  it("searches tags across name and slug by default", async () => {
    const expectedTags = [
      { id: 3, name: "Hazardous", slug: "hazardous" },
      { id: 4, name: "Sharps", slug: "hazardous-sharps" },
    ];

    const whereMock = vi.fn().mockReturnValue(Promise.resolve(expectedTags));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    vi.spyOn(mockDb, "select").mockReturnValue({ from: fromMock } as any);

    const ilikeSpy = vi.spyOn(drizzleOrm, "ilike");
    const orSpy = vi.spyOn(drizzleOrm, "or");

    const result = await TagsService.getAll({ search: "haz" });

    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(schema.tags);
    expect(ilikeSpy).toHaveBeenCalledWith(schema.tags.name, "%haz%");
    expect(ilikeSpy).toHaveBeenCalledWith(schema.tags.slug, "%haz%");
    expect(orSpy).toHaveBeenCalledTimes(1);
    expect(whereMock).toHaveBeenCalledWith(orSpy.mock.results[0]?.value);
    expect(result).toEqual(expectedTags);
  });

  it("searches tags using provided query keys", async () => {
    const expectedTags = [{ id: 5, name: "General", slug: "general-haz" }];

    const whereResult = Promise.resolve(expectedTags);
    const whereMock = vi.fn().mockReturnValue(whereResult);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    vi.spyOn(mockDb, "select").mockReturnValue({ from: fromMock } as any);

    const ilikeSpy = vi.spyOn(drizzleOrm, "ilike");
    const orSpy = vi.spyOn(drizzleOrm, "or");

    const result = await TagsService.getAll({ search: "haz", keys: ["slug"] });

    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(schema.tags);
    expect(ilikeSpy).toHaveBeenCalledWith(schema.tags.slug, "%haz%");
    expect(orSpy).not.toHaveBeenCalled();
    expect(whereMock).toHaveBeenCalledWith(ilikeSpy.mock.results[0]?.value);
    expect(result).toEqual(expectedTags);
  });

  it("filters tags by name", async () => {
    const expectedTags = [
      { id: 3, name: "Hazardous", slug: "hazardous", color: "#0000ff" },
    ];

    const executeMock = vi.fn().mockResolvedValue(expectedTags);
    const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    vi.spyOn(mockDb, "select").mockReturnValue({ from: fromMock } as any);

    const eqSpy = vi.spyOn(drizzleOrm, "eq");

    const result = await TagsService.getByName("Hazardous");

    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(schema.tags);
    expect(eqSpy).toHaveBeenCalledWith(schema.tags.name, "Hazardous");
    expect(whereMock).toHaveBeenCalledWith(eqSpy.mock.results[0]?.value);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedTags);
  });

  it("creates a tag when a color is provided", async () => {
    const payload = {
      name: "Composting",
      slug: "composting",
      color: "#123456",
      description: "Organic waste",
    };
    const createdRows = [{ id: 4, ...payload }];

    const returningMock = vi.fn().mockResolvedValue(createdRows);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    vi.spyOn(mockDb, "insert").mockReturnValue({ values: valuesMock } as any);

    const randomColorSpy = vi.spyOn(TagsService as any, "randomColor");

    const result = await TagsService.createTag({ ...payload });

    expect(randomColorSpy).not.toHaveBeenCalled();
    expect(parseMock).toHaveBeenCalledWith(expect.objectContaining(payload));
    expect(mockDb.insert).toHaveBeenCalledWith(schema.tags);
    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining(payload));
    expect(returningMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(createdRows);
  });

  it("creates a tag and generates a color when one is missing", async () => {
    const payload = {
      name: "Sharps",
      slug: "sharps",
      description: "Needle disposal",
    } as CreateTagBody;

    const generatedHex = "#abcdef";
    const createdRows = [
      { id: 5, ...payload, color: generatedHex },
    ] as (typeof tagsInsertSchema.static)[];

    const returningMock = vi.fn().mockResolvedValue(createdRows);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    vi.spyOn(mockDb, "insert").mockReturnValue({ values: valuesMock } as any);

    const mockColor = { hex: vi.fn().mockReturnValue(generatedHex) };
    const randomColorSpy = vi
      .spyOn(TagsService as any, "randomColor")
      .mockReturnValue(mockColor as any);

    const result = await TagsService.createTag(payload);

    expect(randomColorSpy).toHaveBeenCalledTimes(1);
    expect(mockColor.hex).toHaveBeenCalledTimes(1);
    expect(payload.color).toBe(generatedHex);
    expect(parseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: payload.name,
        slug: payload.slug,
        color: generatedHex,
      }),
    );
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: payload.name,
        slug: payload.slug,
        color: generatedHex,
      }),
    );
    expect(returningMock).toHaveBeenCalledTimes(1);

    expect(result).toEqual(createdRows);
  });
});
