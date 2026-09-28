import { NextResponse } from "next/server";
import { buildImagePrompt } from "@/lib/imagePromptBuilder";
import type { Trait } from "@/data/questions";

interface NormalizedScores {
  imagination: number;
  relationship: number;
  structure: number;
  emotion: number;
  exploration: number;
}

interface ImageRequestBody {
  resultType: string;
  topTraits: [Trait, Trait];
  normalizedScores: NormalizedScores;
}

interface CloudflareImageResponse {
  result?: {
    image?: string;
  };
}

const validTraits: Trait[] = [
  "imagination",
  "relationship",
  "structure",
  "emotion",
  "exploration",
];

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isImageRequestBody(value: unknown): value is ImageRequestBody {
  if (!isRecord(value)) {
    return false;
  }

  const { resultType, topTraits, normalizedScores } = value;

  if (
    typeof resultType !== "string" ||
    resultType.trim().length === 0 ||
    resultType.length > 120 ||
    !Array.isArray(topTraits) ||
    topTraits.length !== 2 ||
    !validTraits.includes(topTraits[0] as Trait) ||
    !validTraits.includes(topTraits[1] as Trait) ||
    topTraits[0] === topTraits[1] ||
    !isRecord(normalizedScores)
  ) {
    return false;
  }

  return validTraits.every((trait) => {
    const score = normalizedScores[trait];

    return (
      typeof score === "number" &&
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 100
    );
  });
}

export async function POST(request: Request) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "이미지 생성 서비스 설정을 확인해주세요." },
        { status: 503 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "요청 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (!isImageRequestBody(body)) {
      return NextResponse.json(
        { error: "잘못된 결과 데이터입니다." },
        { status: 400 }
      );
    }

    const { resultType, topTraits, normalizedScores } = body;
    const prompt = buildImagePrompt({
      resultType,
      topTraits,
      normalizedScores,
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          steps: 4,
        }),
      }
    );

    if (!response.ok) {
      const requestId = response.headers.get("cf-ray") ?? "unknown";

      console.error("Cloudflare image request failed", {
        status: response.status,
        requestId,
      });

      const message =
        response.status === 429
          ? "이미지 생성 요청이 많습니다. 잠시 후 다시 시도해주세요."
          : response.status === 401 || response.status === 403
            ? "이미지 생성 서비스를 현재 사용할 수 없습니다."
            : "이미지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

      return NextResponse.json(
        { error: message },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const data = (await response.json()) as CloudflareImageResponse;
    const imageBase64 = data.result?.image;

    if (!imageBase64) {
      console.error("Cloudflare image response did not contain image data");

      return NextResponse.json(
        { error: "이미지 데이터를 받지 못했습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error(
      "Cloudflare image request encountered an unexpected error",
      error instanceof Error ? error.name : "UnknownError"
    );

    return NextResponse.json(
      { error: "이미지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
