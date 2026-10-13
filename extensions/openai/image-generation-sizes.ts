import type { resolveClosestSize } from "openclaw/plugin-sdk/media-generation-runtime";

const DEFAULT_SIZE = "1024x1024";
const OPENAI_SUPPORTED_SIZES = [
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "2048x2048",
  "2048x1152",
  "3840x2160",
  "2160x3840",
] as const;
const OPENAI_LEGACY_IMAGE_SIZES = ["1024x1024", "1536x1024", "1024x1536"] as const;
// The gpt-image-1 series accepts only OPENAI_LEGACY_IMAGE_SIZES (plus "auto").
const OPENAI_LEGACY_SIZE_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"];

function resolveNativeOpenAIImageSizesForModel(model: string): readonly string[] {
  return OPENAI_LEGACY_SIZE_IMAGE_MODELS.includes(model)
    ? OPENAI_LEGACY_IMAGE_SIZES
    : OPENAI_SUPPORTED_SIZES;
}

/** Advertised geometry; core snaps aspect-ratio hints to these lists before building a request. */
export function resolveOpenAIImageGeometry(flexibleModels: readonly string[]): {
  sizes: string[];
  sizesByModel: Record<string, string[]>;
} {
  return {
    sizes: [...OPENAI_SUPPORTED_SIZES],
    sizesByModel: {
      // Empty model-specific lists stop core from snapping valid flexible dimensions.
      ...Object.fromEntries(flexibleModels.map((model) => [model, []])),
      // Custom endpoints skip native limits, so this list is the only guard for legacy models.
      ...Object.fromEntries(
        OPENAI_LEGACY_SIZE_IMAGE_MODELS.map((model) => [model, [...OPENAI_LEGACY_IMAGE_SIZES]]),
      ),
    },
  };
}

export function resolveOpenAIImageRequestSize(
  params: {
    model: string;
    requestedSize?: string;
    applyNativeLimits: boolean;
  },
  resolveSize: typeof resolveClosestSize,
): {
  size: string;
  metadata?: Record<string, string>;
} {
  const requestedSize = params.requestedSize ?? DEFAULT_SIZE;
  if (!params.applyNativeLimits) {
    return { size: requestedSize };
  }
  const supportedSizes = resolveNativeOpenAIImageSizesForModel(params.model);
  const size =
    resolveSize({
      requestedSize,
      supportedSizes,
    }) ?? DEFAULT_SIZE;
  if (size === requestedSize) {
    return { size };
  }
  return {
    size,
    metadata: {
      requestedSize,
      normalizedSize: size,
    },
  };
}
