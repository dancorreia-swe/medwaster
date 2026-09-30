import { describe, expect, it } from "vitest";
import { parseOriginList } from "../../../lib/origins";

describe("parseOriginList", () => {
  it("splits a comma-separated list", () => {
    expect(parseOriginList("https://a.example,https://b.example")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
  });

  it("trims surrounding whitespace on each entry", () => {
    expect(parseOriginList(" https://a.example , https://b.example ")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
  });

  // Regression: `trustedOrigins: [process.env.CORS_ORIGIN || ""]` put an empty
  // string into Better Auth's allow-list whenever the variable was unset.
  it("never yields an empty entry", () => {
    expect(parseOriginList(undefined)).toEqual([]);
    expect(parseOriginList("")).toEqual([]);
    expect(parseOriginList(",")).toEqual([]);
    expect(parseOriginList("  ")).toEqual([]);
    expect(parseOriginList("https://a.example,,")).toEqual([
      "https://a.example",
    ]);
  });

  it("keeps a single origin as one entry", () => {
    expect(parseOriginList("http://localhost:3000")).toEqual([
      "http://localhost:3000",
    ]);
  });
});
