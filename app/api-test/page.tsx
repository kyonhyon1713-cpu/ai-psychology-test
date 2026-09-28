"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function ApiTestPage() {
  const [image, setImage] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<string | null>(null);
  const isRequestingRef = useRef(false);

  function replaceImage(nextImage: string | null) {
    if (imageRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(imageRef.current);
    }

    imageRef.current = nextImage;
    setImage(nextImage);
  }

  useEffect(() => {
    return () => {
      if (imageRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(imageRef.current);
      }
    };
  }, []);

  async function testApi() {
    if (isRequestingRef.current) return;

    isRequestingRef.current = true;
    setLoading(true);
    setMessage("");
    replaceImage(null);

    try {
      const response = await fetch("/api/result-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultType: "패턴을 읽는 탐험가",
          topTraits: ["imagination", "structure"],
          normalizedScores: {
            imagination: 75,
            relationship: 35,
            structure: 65,
            emotion: 40,
            exploration: 55,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "이미지 생성 실패");
      }

      const blob = await response.blob();

      if (!blob.type.startsWith("image/")) {
        throw new Error("올바른 이미지 응답이 아닙니다.");
      }

      replaceImage(URL.createObjectURL(blob));
      setMessage("Cloudflare 이미지 생성 성공!");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `API 연결 실패: ${error.message}`
          : "API 연결 실패"
      );
    } finally {
      isRequestingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "700px" }}>
      <h1>Cloudflare Workers AI 테스트</h1>

      <button
        className="primary-button"
        type="button"
        onClick={() => void testApi()}
        disabled={loading}
      >
        {loading ? "이미지를 생성하고 있습니다..." : "AI 이미지 생성 테스트"}
      </button>

      <p aria-live="polite">{message}</p>

      {image && (
        <Image
          src={image}
          alt="Cloudflare Workers AI 테스트 결과"
          width={512}
          height={512}
          unoptimized
          style={{ width: "100%", height: "auto", borderRadius: "16px" }}
        />
      )}
    </main>
  );
}
