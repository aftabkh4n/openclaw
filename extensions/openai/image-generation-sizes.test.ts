import { resolveClosestSize } from "openclaw/plugin-sdk/media-generation-runtime";
import { describe, expect, it } from "vitest";
import {
  resolveOpenAIImageGeometry,
  resolveOpenAIImageRequestSize,
} from "./image-generation-sizes.js";

const LEGACY_SIZES = ["1024x1024", "1536x1024", "1024x1536"];

describe("OpenAI image sizes", () => {
  it.each(["gpt-image-1", "gpt-image-1-mini", "gpt-image-1.5"])(
    "clamps %s native requests to legacy sizes",
    (model) => {
      expect(
        resolveOpenAIImageRequestSize(
          { model, requestedSize: "2048x1152", applyNativeLimits: true },
          resolveClosestSize,
        ),
      ).toEqual({
        size: "1536x1024",
        metadata: { requestedSize: "2048x1152", normalizedSize: "1536x1024" },
      });
    },
  );

  it("keeps the broad native size list for gpt-image-2", () => {
    expect(
      resolveOpenAIImageRequestSize(
        { model: "gpt-image-2", requestedSize: "2048x1152", applyNativeLimits: true },
        resolveClosestSize,
      ),
    ).toEqual({ size: "2048x1152" });
  });

  it.each([
    ["16:9", "1536x1024"],
    ["21:9", "1536x1024"],
    ["9:16", "1024x1536"],
  ])("maps gpt-image-1.5 aspect ratio %s to a legacy size on any endpoint", (aspect, size) => {
    // Custom endpoints skip native limits, so core's aspect-ratio snapping against the
    // advertised model list is what keeps unsupported sizes out of the request.
    const geometry = resolveOpenAIImageGeometry(["gpt-image-2"]);
    const sizes = geometry.sizesByModel["gpt-image-1.5"];
    expect(sizes).toEqual(LEGACY_SIZES);
    expect(resolveClosestSize({ requestedAspectRatio: aspect, supportedSizes: sizes })).toBe(size);
  });

  it("leaves flexible models unconstrained", () => {
    expect(resolveOpenAIImageGeometry(["gpt-image-2"]).sizesByModel["gpt-image-2"]).toEqual([]);
  });
});
