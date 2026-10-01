"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type CardState = "loading" | "success" | "error";
type ActionState = "idle" | "saving" | "sharing";

const DOWNLOAD_FILENAME = "abstract-perception-result.png";

function usesManualImageSave() {
  const userAgent = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/i.test(userAgent);
  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isKnownInAppBrowser =
    /FBAN|FBAV|Instagram|KAKAOTALK|NAVER|Line\//i.test(userAgent);

  return isIos || isIpadOs || isKnownInAppBrowser;
}

function canShareImageFile(blob: Blob) {
  if (
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return false;
  }

  try {
    const file = new File([blob], DOWNLOAD_FILENAME, { type: "image/png" });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export default function ShareCardViewer({ id }: { id: string }) {
  const [cardState, setCardState] = useState<CardState>("loading");
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState("");
  const [isFileShareSupported, setIsFileShareSupported] = useState(false);
  const cardUrlRef = useRef<string | null>(null);
  const cardBlobRef = useRef<Blob | null>(null);

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
      setActionMessage("");
      setIsFileShareSupported(false);
      cardBlobRef.current = null;
      replaceCardUrl(null);

      try {
        const response = await fetch(`/api/result-card/${id}?inline=1`, {
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
        setIsFileShareSupported(canShareImageFile(blob));
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
    if (actionState !== "idle" || !cardBlobRef.current) return;

    setActionState("saving");
    setActionMessage("");

    if (usesManualImageSave()) {
      const manualSaveWindow = window.open(
        `/share/${id}/save`,
        "_blank",
        "noopener,noreferrer"
      );

      setActionMessage(
        manualSaveWindow
          ? "새 화면에서 이미지를 길게 눌러 사진 앱에 저장해주세요."
          : "새 화면을 열지 못했습니다. 팝업 허용 후 다시 시도해주세요."
      );
      setActionState("idle");
      return;
    }

    let downloadObjectUrl: string | null = null;

    try {
      downloadObjectUrl = URL.createObjectURL(cardBlobRef.current);
      const anchor = document.createElement("a");
      anchor.href = downloadObjectUrl;
      anchor.download = DOWNLOAD_FILENAME;
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setActionMessage("PNG 파일 다운로드를 시작했습니다.");
    } catch {
      setActionMessage("사진을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      const objectUrlToRevoke = downloadObjectUrl;

      if (objectUrlToRevoke) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrlToRevoke), 1000);
      }

      setActionState("idle");
    }
  }

  async function shareCard() {
    if (
      actionState !== "idle" ||
      !cardBlobRef.current ||
      !isFileShareSupported
    ) {
      return;
    }

    setActionState("sharing");
    setActionMessage("");

    const file = new File([cardBlobRef.current], DOWNLOAD_FILENAME, {
      type: "image/png",
    });

    try {
      await navigator.share({
        files: [file],
        title: "내면의 결 결과 카드",
        text: "나의 추상 이미지 성향 테스트 결과 카드",
      });
      setActionMessage("결과 카드 공유를 완료했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setActionMessage("공유를 취소했습니다.");
      } else {
        setActionMessage("결과 카드를 공유하지 못했습니다.");
      }
    } finally {
      setActionState("idle");
    }
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
          disabled={actionState !== "idle"}
        >
          {actionState === "saving" ? "저장 준비 중..." : "사진 저장하기"}
        </button>
        <button
          className="secondary-button shared-card-open"
          type="button"
          onClick={() => void shareCard()}
          disabled={actionState !== "idle" || !isFileShareSupported}
          aria-describedby={!isFileShareSupported ? "share-support-hint" : undefined}
        >
          {actionState === "sharing" ? "공유 준비 중..." : "공유하기"}
        </button>
      </div>
      {actionMessage && (
        <p className="image-action-message" aria-live="polite">
          {actionMessage}
        </p>
      )}
      <p className="shared-card-hint" id="share-support-hint">
        {isFileShareSupported
          ? "저장과 공유는 별도로 동작합니다."
          : "이 브라우저는 이미지 파일 공유를 지원하지 않아 공유 버튼이 비활성화됩니다."}
      </p>
    </section>
  );
}
