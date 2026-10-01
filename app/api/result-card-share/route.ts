import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import {
  hasResultCardStorageConfig,
  resultCardLifetimeSeconds,
  storeResultCard,
} from "@/lib/cloudflareKv";
import { verifyResultShareToken } from "@/lib/shareToken";

const MAX_RESULT_CARD_BYTES = 4 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const shareToken = request.headers.get("X-Result-Share-Token");

  if (!apiToken || !hasResultCardStorageConfig()) {
    return NextResponse.json(
      { error: "휴대폰 전송 기능이 아직 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  if (!shareToken || !verifyResultShareToken(shareToken, apiToken)) {
    return NextResponse.json(
      { error: "이미지 생성 후 다시 시도해주세요." },
      { status: 401 }
    );
  }

  if (request.headers.get("content-type") !== "image/png") {
    return NextResponse.json(
      { error: "PNG 결과 카드만 전송할 수 있습니다." },
      { status: 415 }
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);

  if (declaredLength > MAX_RESULT_CARD_BYTES) {
    return NextResponse.json(
      { error: "결과 카드 용량이 너무 큽니다." },
      { status: 413 }
    );
  }

  const image = await request.arrayBuffer();

  if (image.byteLength === 0 || image.byteLength > MAX_RESULT_CARD_BYTES) {
    return NextResponse.json(
      { error: "결과 카드 용량이 올바르지 않습니다." },
      { status: image.byteLength > MAX_RESULT_CARD_BYTES ? 413 : 400 }
    );
  }

  const id = randomBytes(18).toString("base64url");

  try {
    await storeResultCard(id, image);
  } catch {
    return NextResponse.json(
      { error: "결과 카드를 임시 저장하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    sharePath: `/share/${id}`,
    expiresAt: new Date(
      Date.now() + resultCardLifetimeSeconds * 1000
    ).toISOString(),
  });
}
