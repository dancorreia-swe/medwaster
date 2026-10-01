import { describe, expect, it } from "vitest";
import {
  avatarKeyFor,
  buildAvatarUrl,
  extractAvatarKey,
  isValidAvatarKey,
  publicOriginFromRequest,
} from "../../../modules/profile/avatar-url";

const ID = "3f2b8c1e-9a4d-4e7f-8b6a-1c2d3e4f5a6b";

describe("publicOriginFromRequest", () => {
  // Regression: avatar URLs were built from PUBLIC_S3_ENDPOINT, which falls
  // back to the internal `http://minio:9000` and is unreachable from the app.
  // The URL must use the origin the client actually reached the API on.
  it("uses the reverse proxy's forwarded proto and host", () => {
    const request = new Request("http://server:4000/api/profile/avatar/upload", {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "medwaster.example.com",
      },
    });

    expect(publicOriginFromRequest(request)).toBe(
      "https://medwaster.example.com",
    );
  });

  it("takes the first value of a multi-hop forwarded header", () => {
    const request = new Request("http://server:4000/x", {
      headers: { "x-forwarded-proto": "https, http" },
    });

    expect(publicOriginFromRequest(request)).toBe("https://server:4000");
  });

  it("falls back to the request URL without a proxy", () => {
    const request = new Request("http://192.168.0.10:4000/x");

    expect(publicOriginFromRequest(request)).toBe("http://192.168.0.10:4000");
  });
});

describe("buildAvatarUrl", () => {
  it("points at the API avatar route, not at MinIO", () => {
    expect(buildAvatarUrl("https://medwaster.example.com/", `${ID}.jpg`)).toBe(
      `https://medwaster.example.com/api/profile/avatar/${ID}.jpg`,
    );
  });
});

describe("avatarKeyFor", () => {
  it("derives the extension from the MIME type", () => {
    expect(avatarKeyFor(ID, "image/png")).toBe(`${ID}.png`);
    expect(avatarKeyFor(ID, "image/jpeg")).toBe(`${ID}.jpg`);
  });

  it("produces keys the avatar route accepts", () => {
    for (const mime of ["image/jpeg", "image/png", "image/gif", "image/webp"]) {
      expect(isValidAvatarKey(avatarKeyFor(ID, mime))).toBe(true);
    }
  });
});

describe("isValidAvatarKey", () => {
  it("rejects anything that is not a generated key", () => {
    expect(isValidAvatarKey("../secret")).toBe(false);
    expect(isValidAvatarKey(`${ID}.html`)).toBe(false);
    expect(isValidAvatarKey("avatar.jpg")).toBe(false);
  });
});

describe("extractAvatarKey", () => {
  const options = {
    bucket: "avatars",
    legacyEndpoints: ["http://minio:9000"],
  };

  it("reads the key from an API avatar URL on any origin", () => {
    expect(
      extractAvatarKey(
        `https://medwaster.example.com/api/profile/avatar/${ID}.png`,
        options,
      ),
    ).toBe(`${ID}.png`);
  });

  it("reads the key from a legacy direct-MinIO URL", () => {
    expect(
      extractAvatarKey(`http://minio:9000/avatars/${ID}.png`, options),
    ).toBe(`${ID}.png`);
  });

  it("ignores external pictures such as Google profile photos", () => {
    expect(
      extractAvatarKey("https://lh3.googleusercontent.com/a/abc=s96-c", options),
    ).toBeNull();
  });
});
