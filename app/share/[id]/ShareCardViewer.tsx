"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type CardState = "loading" | "success" | "error";
type SaveState = "idle" | "saving";

export default function ShareCardViewer({ id }: { id: string }) {
  const [cardState, setCardState] = useState<CardState>("loading");
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const cardUrlRef = useRef<string | null>(null);
  const cardBlobRef = useRef<Blob | null>(null);

  const imageUrl = `/api/result-card/${id}`;
  const downloadUrl = `${imageUrl}?download=1`;

  const replaceCardUrl = useCallback((nextUrl: string | null) => {
    if (cardUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(cardUrlRef.current);
    }

    cardUrlRef.current = nextUrl;
    setCardUrl(nextUrl);
  }, []);

  const loadCard = useCallback(
    async (signal?: AbortSignal) => {
      setCardState("loading");
      setErrorMessage("");
      setSaveMessage("");
      cardBlobRef.current = null;
      replaceCardUrl(null);

      try {
        const response = await fetch(`/api/result-card/${id}`, {
          cache: "no-store",
          signal,
        });

        if (!response.ok) {
          let message = "결과 카드를 불러오지 못했습니다.";

          try {
            const data = (await response.json()) as { error?: string };
            message = data.error ?? message;
          } catch {
            // JSON 응답이 아니어도 기본 안내 문구를 사용합니다.
          }

          throw new Error(message);
        }

        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
          throw new Error("올바른 결과 카드 이미지를 받지 못했습니다.");
        }

        cardBlobRef.current = blob;
        const objectUrl = URL.createObjectURL(blob);

        if (signal?.aborted) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        replaceCardUrl(objectUrl);
        setCardState("success");
      } catch (error) {
        if (signal?.aborted) return;

        setErrorMessage(
          error instanceof TypeError
            ? "네트워크 연결을 확인한 뒤 다시 시도해주세요."
            : error instanceof Error
              ? error.message
              : "결과 카드를 불러오지 못했습니다."
        );
        setCardState("error");
      }
    },
    [id, replaceCardUrl]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadCard(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();

      if (cardUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(cardUrlRef.current);
      }

      cardUrlRef.current = null;
      cardBlobRef.current = null;
    };
  }, [loadCard]);

  async function saveCard() {
    if (saveState === "saving" || !cardBlobRef.current) return;

    setSaveState("saving");
    setSaveMessage("");

    const file = new File([cardBlobRef.current], "내면의-결-결과-카드.png", {
      type: "image/png",
    });
    const isTouchDevice =
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
    const canShareFile =
      isTouchDevice &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] });
    const startDirectDownload = () => {
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = "내면의-결-결과-카드.png";
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    };

    if (canShareFile) {
      try {
        await navigator.share({
          files: [file],
          title: "내면의 결 결과 카드",
          text: "나의 추상 이미지 성향 테스트 결과 카드",
        });
        setSaveMessage("열린 메뉴에서 이미지 저장을 선택할 수 있습니다.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setSaveState("idle");
          return;
        }

        startDirectDownload();
        setSaveMessage("PNG 파일 다운로드를 시작했습니다.");
      } finally {
        setSaveState("idle");
      }

      return;
    }

    startDirectDownload();
    setSaveMessage("PNG 파일 다운로드를 시작했습니다.");
    setSaveState("idle");
  }

  if (cardState === "loading") {
    return (
      <section className="shared-card-state" aria-live="polite">
        <div className="loading-orbit" aria-hidden="true" />
        <p>결과 카드를 불러오고 있습니다...</p>
      </section>
    );
  }

  if (cardState === "error" || !cardUrl) {
    return (
      <section className="shared-card-state" role="alert">
        <p>{errorMessage || "결과 카드를 불러오지 못했습니다."}</p>
        <button
          className="primary-button"
          type="button"
          onClick={() => void loadCard()}
        >
          다시 불러오기
        </button>
      </section>
    );
  }

  return (
    <section className="shared-card-viewer" aria-labelledby="shared-card-heading">
      <h2 className="sr-only" id="shared-card-heading">
        저장할 결과 카드
      </h2>
      <div className="shared-card-image-wrap">
        <Image
          className="shared-card-image"
          src={cardUrl}
          alt="결과 유형, 상위 두 성향과 AI 내면 풍경이 담긴 결과 카드"
          width={900}
          height={1200}
          unoptimized
          priority
        />
      </div>
      <div className="shared-card-save-actions">
        <button
          className="primary-button shared-card-download"
          type="button"
          onClick={() => void saveCard()}
          disabled={saveState === "saving"}
        >
          {saveState === "saving" ? "저장 준비 중..." : "결과 카드 저장하기"}
        </button>
        <a
          className="secondary-button shared-card-open"
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
        >
          PNG 직접 열기
        </a>
      </div>
      {saveMessage && (
        <p className="image-action-message" aria-live="polite">
          {saveMessage}
        </p>
      )}
      <p className="shared-card-hint">
        휴대폰에서는 저장 메뉴가 열립니다. 인앱 브라우저에서 동작하지 않으면
        PNG를 직접 연 뒤 이미지를 길게 눌러 저장해주세요.
      </p>
    </section>
  );
}
