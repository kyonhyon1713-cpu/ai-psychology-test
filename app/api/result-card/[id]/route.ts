import { NextResponse } from "next/server";

import {
  hasResultCardStorageConfig,
  isValidResultCardId,
  readResultCard,
} from "@/lib/cloudflareKv";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidResultCardId(id)) {
    return NextResponse.json(
      { error: "유효하지 않은 결과 카드 주소입니다." },
      { status: 400 }
    );
  }

  if (!hasResultCardStorageConfig()) {
    return NextResponse.json(
      { error: "결과 카드 저장소가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  try {
    const image = await readResultCard(id);

    if (!image) {
      return NextResponse.json(
        { error: "결과 카드를 찾을 수 없거나 보관 기간이 지났습니다." },
        { status: 404 }
      );
    }

    const shouldDownload = new URL(request.url).searchParams.has("download");
    const dispositionFilename =
      "filename=\"abstract-perception-result.png\"; " +
      "filename*=UTF-8''%EB%82%B4%EB%A9%B4%EC%9D%98-%EA%B2%B0-%EA%B2%B0%EA%B3%BC-%EC%B9%B4%EB%93%9C.png";

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(image.byteLength),
        "Content-Disposition": shouldDownload
          ? `attachment; ${dispositionFilename}`
          : `inline; ${dispositionFilename}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "결과 카드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
