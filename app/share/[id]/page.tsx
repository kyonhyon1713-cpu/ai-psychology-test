import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isValidResultCardId } from "@/lib/cloudflareKv";
import ShareCardViewer from "./ShareCardViewer";

export const metadata: Metadata = {
  title: "나의 결과 카드 | 내면의 결",
  description: "추상 이미지 성향 테스트의 결과 카드입니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharedResultCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidResultCardId(id)) {
    notFound();
  }

  return (
    <main className="shared-card-shell">
      <header className="shared-card-header">
        <p className="result-overline">ABSTRACT PERCEPTION TEST</p>
        <h1>나의 결과 카드</h1>
        <p>
          태블릿에서 만든 결과 카드입니다. 이미지를 저장하면 휴대폰에서 간직할 수
          있어요.
        </p>
      </header>

      <ShareCardViewer id={id} />

      <div className="result-actions">
        <Link className="ghost-button" href="/">
          테스트 홈으로 이동
        </Link>
      </div>
    </main>
  );
}
