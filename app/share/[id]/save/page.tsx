import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isValidResultCardId } from "@/lib/cloudflareKv";

export const metadata: Metadata = {
  title: "결과 카드 사진 저장 | 내면의 결",
  description: "결과 카드 이미지를 길게 눌러 사진 앱에 저장하세요.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ManualSavePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidResultCardId(id)) {
    notFound();
  }

  return (
    <main className="shared-card-shell manual-save-shell">
      <header className="shared-card-header">
        <p className="result-overline">SAVE TO PHOTOS</p>
        <h1>사진 앱에 저장하기</h1>
        <p className="manual-save-instruction">
          아래 이미지를 길게 누른 뒤 <strong>사진에 저장</strong> 또는
          <strong> 이미지 저장</strong>을 선택하세요.
        </p>
      </header>

      <section className="shared-card-viewer" aria-label="길게 눌러 저장할 결과 카드">
        <div className="shared-card-image-wrap">
          <Image
            className="shared-card-image"
            src={`/api/result-card/${id}?inline=1`}
            alt="길게 눌러 사진 앱에 저장할 결과 카드"
            width={900}
            height={1200}
            unoptimized
            priority
          />
        </div>
      </section>

      <div className="result-actions">
        <Link className="ghost-button" href={`/share/${id}`}>
          결과 카드로 돌아가기
        </Link>
      </div>
    </main>
  );
}
