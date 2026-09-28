"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Trait } from "@/data/questions";
import type { CalculatedResult } from "@/lib/scoring";

import {
  getResultTypeProfile,
} from "@/data/resultTypes";

const RESULT_STORAGE_KEY =
  "abstract-perception-result";

const traitLabels: Record<
  Trait,
  string
> = {
  imagination: "상상적 해석",
  relationship: "관계적 해석",
  structure: "구조적 인식",
  emotion: "감정적 반응",
  exploration: "탐색적 해석",
};

const traitOrder: Trait[] = [
  "imagination",
  "relationship",
  "structure",
  "emotion",
  "exploration",
];

type ImageState =
  | "idle"
  | "loading"
  | "success"
  | "error";

function isStoredResult(
  value: unknown
): value is CalculatedResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate =
    value as Partial<CalculatedResult>;

  return (
    typeof candidate.resultType ===
      "string" &&
    typeof candidate.summary ===
      "string" &&
    Array.isArray(
      candidate.topTraits
    ) &&
    candidate.topTraits.length === 2 &&
    candidate.topTraits.every((trait) =>
      traitOrder.includes(trait)
    ) &&
    candidate.topTraits[0] !== candidate.topTraits[1] &&
    !!candidate.rawScores &&
    !!candidate.normalizedScores &&
    traitOrder.every(
      (trait) =>
        Number.isFinite(candidate.rawScores?.[trait]) &&
        Number.isFinite(candidate.normalizedScores?.[trait]) &&
        (candidate.normalizedScores?.[trait] ?? -1) >= 0 &&
        (candidate.normalizedScores?.[trait] ?? 101) <= 100
    )
  );
}

export default function ResultImagePage() {
  const [result, setResult] =
    useState<CalculatedResult | null>(
      null
    );

  const [isReady, setIsReady] =
    useState(false);

  const [imageState, setImageState] =
    useState<ImageState>("idle");

  const [
    imageErrorMessage,
    setImageErrorMessage,
  ] = useState("");

  const [
    resultImage,
    setResultImage,
  ] = useState<string | null>(null);

  const [
    imageAction,
    setImageAction,
  ] = useState<
    "share" | "save" | null
  >(null);

  const [
    imageActionMessage,
    setImageActionMessage,
  ] = useState("");

  const hasInitialized = useRef(false);
  const isGeneratingRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const resultImageRef = useRef<string | null>(null);

  const replaceResultImage = useCallback((nextImage: string | null) => {
    const previousImage = resultImageRef.current;

    if (previousImage?.startsWith("blob:")) {
      URL.revokeObjectURL(previousImage);
    }

    resultImageRef.current = nextImage;
    setResultImage(nextImage);
  }, []);

  /* =========================
     이미지 생성
  ========================= */

  const generateResultImage =
    useCallback(
      async (
        resultData: CalculatedResult
      ) => {
        if (isGeneratingRef.current) {
          return;
        }

        isGeneratingRef.current = true;
        const controller = new AbortController();
        activeRequestRef.current = controller;

        setImageState("loading");
        setImageErrorMessage("");
        setImageActionMessage("");
        replaceResultImage(null);

        try {
          const response =
            await fetch(
              "/api/result-image",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  resultType:
                    resultData.resultType,

                  topTraits:
                    resultData.topTraits,

                  normalizedScores:
                    resultData.normalizedScores,
                }),
                signal: controller.signal,
              }
            );

          if (!response.ok) {
            let message =
              "이미지 생성에 실패했습니다.";

            try {
              const errorData =
                (await response.json()) as {
                  error?: string;
                  detail?: string;
                  message?: string;
                };

              message =
                errorData.message ??
                errorData.error ??
                errorData.detail ??
                message;
            } catch {
              // JSON 에러 응답이 아닐 경우
            }

            throw new Error(message);
          }

          const blob =
            await response.blob();

          if (
            !blob.size ||
            !blob.type.startsWith(
              "image/"
            )
          ) {
            throw new Error(
              "올바른 이미지 응답을 받지 못했습니다."
            );
          }

          const imageUrl =
            URL.createObjectURL(blob);

          if (controller.signal.aborted) {
            URL.revokeObjectURL(imageUrl);
            return;
          }

          replaceResultImage(imageUrl);
          setImageState("success");
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }

          const message =
            error instanceof TypeError
              ? "네트워크 연결을 확인한 뒤 다시 시도해주세요."
              : error instanceof Error && error.message
                ? error.message
                : "이미지를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.";

          setImageErrorMessage(message);
          setImageState("error");
        } finally {
          if (activeRequestRef.current === controller) {
            activeRequestRef.current = null;
          }

          isGeneratingRef.current = false;
        }
      },
      [replaceResultImage]
    );

  /* =========================
     결과 불러오기
  ========================= */

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (hasInitialized.current) {
        return;
      }

      hasInitialized.current = true;

      try {
        const storedValue =
          sessionStorage.getItem(
            RESULT_STORAGE_KEY
          );

        const parsedValue: unknown =
          storedValue
            ? JSON.parse(storedValue)
            : null;

        if (isStoredResult(parsedValue)) {
          setResult(parsedValue);
        }
      } catch (error) {
        console.error(
          "저장된 결과를 불러오지 못했습니다:",
          error
        );
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  /* =========================
     blob URL 정리
  ========================= */

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();

      const imageUrl = resultImageRef.current;

      if (imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }

      resultImageRef.current = null;
    };
  }, []);

  /* =========================
     이미지 저장
  ========================= */

  function downloadBlob(blob: Blob) {
    const objectUrl =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = objectUrl;

    anchor.download =
      "내면의-풍경.png";

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(
        objectUrl
      );
    }, 1000);
  }

  async function saveResultImage() {
    if (
      !resultImage ||
      imageAction
    ) {
      return;
    }

    setImageAction("save");
    setImageActionMessage("");

    try {
      const imageBlob =
        await fetch(
          resultImage
        ).then((response) =>
          response.blob()
        );

      downloadBlob(imageBlob);

      setImageActionMessage(
        "이미지를 저장했습니다."
      );
    } catch (error) {
      console.error(
        "결과 이미지 저장 실패:",
        error
      );

      setImageActionMessage(
        "이미지를 저장하지 못했습니다."
      );
    } finally {
      setImageAction(null);
    }
  }

  /* =========================
     이미지 공유
  ========================= */

  async function shareResultImage() {
    if (
      !resultImage ||
      imageAction
    ) {
      return;
    }

    setImageAction("share");
    setImageActionMessage("");

    try {
      const imageBlob =
        await fetch(
          resultImage
        ).then((response) =>
          response.blob()
        );

      const imageFile =
        new File(
          [imageBlob],
          "내면의-풍경.png",
          {
            type:
              imageBlob.type ||
              "image/png",
          }
        );

      if (
        navigator.share &&
        (!navigator.canShare ||
          navigator.canShare({
            files: [imageFile],
          }))
      ) {
        await navigator.share({
          title:
            result?.resultType ??
            "내면의 풍경",

          text:
            "추상 이미지 성향 테스트로 발견한 나의 내면 풍경",

          files: [imageFile],
        });

        setImageActionMessage(
          "공유가 완료되었습니다."
        );
      } else {
        downloadBlob(imageBlob);

        setImageActionMessage(
          "공유 기능을 지원하지 않아 이미지를 저장했습니다."
        );
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        setImageActionMessage(
          "공유가 취소되었습니다."
        );
      } else {
        console.error(
          "결과 이미지 공유 실패:",
          error
        );

        setImageActionMessage(
          "이미지를 공유하지 못했습니다."
        );
      }
    } finally {
      setImageAction(null);
    }
  }

  /* =========================
     로딩
  ========================= */

  if (!isReady) {
    return (
      <main className="result-shell">
        <section className="empty-card" aria-live="polite">
          <div
            className="loading-orbit"
            aria-hidden="true"
          />

          <p>
            결과를 불러오고 있습니다...
          </p>
        </section>
      </main>
    );
  }

  /* =========================
     결과 없음
  ========================= */

  if (!result) {
    return (
      <main className="result-shell">
        <section className="empty-card">
          <h1>
            결과를 찾을 수 없습니다
          </h1>

          <p>
            먼저 테스트를 완료해주세요.
          </p>

          <Link
            className="primary-button"
            href="/test"
          >
            테스트 시작하기
          </Link>
        </section>
      </main>
    );
  }

  const profile =
    getResultTypeProfile(
      result.topTraits
    );

  const firstTrait =
    result.topTraits[0];

  const secondTrait =
    result.topTraits[1];

  /* =========================
     화면
  ========================= */

  return (
    <main className="result-shell">
      {/* 헤더 */}

      <header className="result-header">
        <p className="result-overline">
          YOUR AI LANDSCAPE
        </p>

        <h1>당신의 내면 풍경</h1>

        <p className="result-summary">
          <strong>
            {profile.name}
          </strong>
          의 성향을 하나의 추상적인
          이미지로 표현합니다.
        </p>
      </header>

      {/* 이미지 영역 */}

      <section
        className="image-card image-generator-card"
        aria-labelledby="image-heading"
      >
        <div className="image-card-header">
          <h2 id="image-heading">
            AI가 표현하는 내면 풍경
          </h2>

          <p>
            AI는 결과를 판단하지 않고,
            이미 계산된 성향을 이미지로
            시각화하는 데만 사용됩니다.
          </p>
        </div>

        {/* 생성 전 */}

        {imageState === "idle" && (
          <div className="image-state">
            <div>
              <p>
                가장 두드러진
                {" "}
                <strong>
                  {
                    traitLabels[
                      firstTrait
                    ]
                  }
                </strong>
                과
                {" "}
                <strong>
                  {
                    traitLabels[
                      secondTrait
                    ]
                  }
                </strong>
                을 바탕으로 당신만의
                이미지를 생성합니다.
              </p>

              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  void generateResultImage(
                    result
                  )
                }
              >
                내면 풍경 이미지 생성하기
              </button>
            </div>
          </div>
        )}

        {/* 생성 중 */}

        {imageState ===
          "loading" && (
          <div
            className="image-state"
            aria-live="polite"
          >
            <div>
              <div
                className="loading-orbit"
                aria-hidden="true"
              />

              <p>
                AI가 당신의 성향을
                이미지로 표현하고
                있습니다...
              </p>
            </div>
          </div>
        )}

        {/* 성공 */}

        {imageState ===
          "success" &&
          resultImage && (
            <>
              <div className="generated-image-wrap">
                <Image
                  className="generated-image"
                  src={resultImage}
                  alt={`AI가 표현한 ${profile.name}의 내면 풍경`}
                  width={1024}
                  height={1024}
                  unoptimized
                />
              </div>

              {/* 이미지 설명 */}

              <section
                className="profile-section"
                style={{
                  marginTop: "20px",
                  marginBottom: 0,
                }}
              >
                <div className="profile-section-header">
                  <span className="profile-eyebrow">
                    IMAGE MEANING
                  </span>

                  <h2>
                    이 이미지는 무엇을
                    표현했을까요?
                  </h2>
                </div>

                <p
                  style={{
                    lineHeight: 1.9,
                    margin: 0,
                  }}
                >
                  이 이미지는 당신에게
                  두드러진
                  {" "}
                  <strong>
                    {
                      traitLabels[
                        firstTrait
                      ]
                    }
                  </strong>
                  과
                  {" "}
                  <strong>
                    {
                      traitLabels[
                        secondTrait
                      ]
                    }
                  </strong>
                  의 조합을 바탕으로
                  만들어졌습니다.
                  {" "}
                  {profile.name}에게
                  나타나는 생각과 관계,
                  감정, 행동의 특징을
                  색과 형태, 균형감,
                  추상적인 구성으로
                  표현한 이미지입니다.
                </p>
              </section>

              {/* 저장/공유 */}

              <div className="image-utility-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    void shareResultImage()
                  }
                  disabled={
                    imageAction !== null
                  }
                >
                  {imageAction ===
                  "share"
                    ? "공유 준비 중..."
                    : "공유하기"}
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    void saveResultImage()
                  }
                  disabled={
                    imageAction !== null
                  }
                >
                  {imageAction ===
                  "save"
                    ? "저장 중..."
                    : "저장하기"}
                </button>
              </div>

              {imageActionMessage && (
                <p
                  className="image-action-message"
                  aria-live="polite"
                >
                  {imageActionMessage}
                </p>
              )}

              <div className="image-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    void generateResultImage(
                      result
                    )
                  }
                  disabled={imageAction !== null}
                >
                  이미지 다시 생성하기
                </button>
              </div>
            </>
          )}

        {/* 실패 */}

        {imageState === "error" && (
          <div
            className="image-state"
            role="alert"
          >
            <div>
              <p>
                {imageErrorMessage ||
                  "이미지를 생성하지 못했습니다. 잠시 후 다시 시도해주세요."}
              </p>

              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  void generateResultImage(
                    result
                  )
                }
              >
                다시 시도하기
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 돌아가기 */}

      <div className="result-actions">
        <Link
          className="ghost-button"
          href="/result"
        >
          ← 결과 해석으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
