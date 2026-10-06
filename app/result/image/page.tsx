"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Trait } from "@/data/questions";
import type { CalculatedResult } from "@/lib/scoring";
import { createResultCardPng } from "@/lib/resultCard";

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

type CardAction = "save" | "qr" | null;

interface CardShareData {
  url: string;
  qrCode: string;
  expiresAt: string;
}

const PRODUCTION_SHARE_ORIGIN = "https://ai-psychology-test.vercel.app";

function isLoopbackUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;

    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

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
  const router = useRouter();

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

  const [shareToken, setShareToken] = useState<string | null>(null);
  const [cardAction, setCardAction] = useState<CardAction>(null);
  const [cardActionMessage, setCardActionMessage] = useState("");
  const [cardShareData, setCardShareData] =
    useState<CardShareData | null>(null);
  const [isQrVisible, setIsQrVisible] = useState(false);

  const hasInitialized = useRef(false);
  const isGeneratingRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const resultImageRef = useRef<string | null>(null);
  const resultCardBlobRef = useRef<Blob | null>(null);
  const isCardActionRunningRef = useRef(false);

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
        if (isGeneratingRef.current || isCardActionRunningRef.current) {
          return;
        }

        isGeneratingRef.current = true;
        const controller = new AbortController();
        activeRequestRef.current = controller;

        setImageState("loading");
        setImageErrorMessage("");
        setImageActionMessage("");
        setShareToken(null);
        setCardActionMessage("");
        setCardShareData(null);
        setIsQrVisible(false);
        resultCardBlobRef.current = null;
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

          const nextShareToken = response.headers.get(
            "X-Result-Share-Token"
          );

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
          setShareToken(nextShareToken);
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

  function downloadBlob(blob: Blob, filename = "내면의-풍경.png") {
    const objectUrl =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = objectUrl;

    anchor.download = filename;

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

  async function getResultCardBlob() {
    if (!resultImage) {
      throw new Error("먼저 내면 풍경 이미지를 생성해주세요.");
    }

    if (resultCardBlobRef.current) {
      return resultCardBlobRef.current;
    }

    const cardBlob = await createResultCardPng({
      resultType: profile.name,
      topTraits: [traitLabels[firstTrait], traitLabels[secondTrait]],
      summary: profile.summary,
      imageUrl: resultImage,
    });

    resultCardBlobRef.current = cardBlob;
    return cardBlob;
  }

  async function saveResultCard() {
    if (cardAction || imageAction || isCardActionRunningRef.current) return;

    isCardActionRunningRef.current = true;
    setCardAction("save");
    setCardActionMessage("");

    try {
      const cardBlob = await getResultCardBlob();
      downloadBlob(cardBlob, "내면의-결-결과-카드.png");
      setCardActionMessage("결과 카드를 저장했습니다.");
    } catch (error) {
      setCardActionMessage(
        error instanceof Error
          ? error.message
          : "결과 카드를 저장하지 못했습니다."
      );
    } finally {
      isCardActionRunningRef.current = false;
      setCardAction(null);
    }
  }

  async function showPhoneQr() {
    if (cardAction || imageAction || isCardActionRunningRef.current) return;

    if (cardShareData) {
      setIsQrVisible(true);
      return;
    }

    if (!shareToken) {
      setCardActionMessage(
        "휴대폰 전송 정보를 만들 수 없습니다. 이미지를 다시 생성해주세요."
      );
      return;
    }

    isCardActionRunningRef.current = true;
    setCardAction("qr");
    setCardActionMessage("");

    try {
      const cardBlob = await getResultCardBlob();
      const response = await fetch("/api/result-card-share", {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
          "X-Result-Share-Token": shareToken,
        },
        body: cardBlob,
      });

      const data = (await response.json()) as {
        sharePath?: string;
        expiresAt?: string;
        error?: string;
      };

      if (!response.ok || !data.sharePath || !data.expiresAt) {
        throw new Error(
          data.error ?? "휴대폰 전송 링크를 만들지 못했습니다."
        );
      }

      // Preview/개별 Deployment URL이 QR에 들어가지 않도록 production에서는
      // 고정 Production alias를 사용하고, 개발 환경에서만 현재 origin을 사용합니다.
      const shareOrigin =
        process.env.NODE_ENV === "production"
          ? PRODUCTION_SHARE_ORIGIN
          : window.location.origin;
      const url = new URL(data.sharePath, `${shareOrigin}/`).toString();
      const qrCode = await QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#17191fff",
          light: "#f5f2eaff",
        },
      });

      setCardShareData({
        url,
        qrCode,
        expiresAt: data.expiresAt,
      });
      setIsQrVisible(true);
      setCardActionMessage("QR 코드가 준비되었습니다.");
    } catch (error) {
      setCardActionMessage(
        error instanceof Error
          ? error.message
          : "휴대폰 전송 링크를 만들지 못했습니다."
      );
    } finally {
      isCardActionRunningRef.current = false;
      setCardAction(null);
    }
  }

  async function copyShareLink() {
    if (!cardShareData) return;

    try {
      await navigator.clipboard.writeText(cardShareData.url);
      setCardActionMessage("공유 링크를 복사했습니다.");
    } catch {
      setCardActionMessage("링크를 복사하지 못했습니다. QR 코드를 이용해주세요.");
    }
  }

  function returnToHome() {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
    router.replace("/");
  }

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

              <section className="image-result-meta" aria-label="이미지 결과 정보">
                <div className="image-result-type">
                  <span className="profile-eyebrow">RESULT</span>
                  <h2>{profile.name}</h2>
                </div>
                <div className="image-result-traits">
                  <span className="profile-eyebrow">TOP TRAITS</span>
                  <ol>
                    <li>
                      <span>01</span>
                      <strong>{traitLabels[firstTrait]}</strong>
                    </li>
                    <li>
                      <span>02</span>
                      <strong>{traitLabels[secondTrait]}</strong>
                    </li>
                  </ol>
                </div>
              </section>

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

              {/* 결과 카드 저장/휴대폰 전송 */}

              <section
                className="result-card-tools"
                aria-labelledby="result-card-tools-heading"
              >
                <div className="result-card-tools-header">
                  <span className="profile-eyebrow">TAKE IT WITH YOU</span>
                  <h2 id="result-card-tools-heading">결과 카드를 간직하세요</h2>
                  <p>
                    결과 유형과 상위 성향, AI 이미지만 담은 한 장의 PNG 카드로
                    저장할 수 있어요.
                  </p>
                </div>

                <div className="result-card-tool-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => void saveResultCard()}
                    disabled={cardAction !== null || imageAction !== null}
                  >
                    {cardAction === "save"
                      ? "카드 만드는 중..."
                      : "결과 카드 저장하기"}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void showPhoneQr()}
                    disabled={cardAction !== null || imageAction !== null}
                  >
                    {cardAction === "qr"
                      ? "QR 준비 중..."
                      : "휴대폰으로 가져가기"}
                  </button>
                </div>

                {cardActionMessage && (
                  <p className="image-action-message" aria-live="polite">
                    {cardActionMessage}
                  </p>
                )}

                {isQrVisible && cardShareData && (
                  <div className="qr-share-panel" aria-live="polite">
                    <div className="qr-share-copy">
                      <span className="profile-eyebrow">SCAN WITH YOUR PHONE</span>
                      <h3>휴대폰 카메라로 QR을 스캔하세요</h3>
                      <p>
                        휴대폰에서 결과 카드를 열어 PNG로 저장할 수 있습니다. 링크는
                        24시간 후 자동으로 만료됩니다.
                      </p>
                      <p className="qr-share-expiry">
                        만료 예정: {new Date(cardShareData.expiresAt).toLocaleString("ko-KR")}
                      </p>
                      <div className="qr-share-url-block">
                        <span>QR에 포함된 주소</span>
                        <a
                          href={cardShareData.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {cardShareData.url}
                        </a>
                      </div>
                      {isLoopbackUrl(cardShareData.url) && (
                        <p className="qr-local-warning" role="alert">
                          현재 QR은 localhost 주소입니다. 휴대폰에서는 연결되지
                          않습니다. Vercel 배포 주소에서 다시 생성하거나, 같은
                          Wi-Fi에서 이 페이지를 PC의 네트워크 주소로 열어주세요.
                        </p>
                      )}
                    </div>
                    <div className="qr-code-wrap">
                      <Image
                        src={cardShareData.qrCode}
                        alt="휴대폰에서 결과 카드를 여는 QR 코드"
                        width={240}
                        height={240}
                        unoptimized
                      />
                    </div>
                    <div className="qr-share-actions">
                      <a
                        className="secondary-button"
                        href={cardShareData.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        공유 페이지 미리보기
                      </a>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => void copyShareLink()}
                      >
                        링크 복사하기
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => setIsQrVisible(false)}
                      >
                        QR 닫기
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* AI 원본 이미지 저장/공유 */}

              <div className="image-utility-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    void shareResultImage()
                  }
                  disabled={
                    imageAction !== null || cardAction !== null
                  }
                >
                  {imageAction ===
                  "share"
                    ? "공유 준비 중..."
                    : "AI 이미지 공유하기"}
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    void saveResultImage()
                  }
                  disabled={
                    imageAction !== null || cardAction !== null
                  }
                >
                  {imageAction ===
                  "save"
                    ? "저장 중..."
                    : "AI 이미지만 저장하기"}
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
                  disabled={imageAction !== null || cardAction !== null}
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
        <button
          className="ghost-button"
          type="button"
          onClick={returnToHome}
        >
          처음으로 돌아가기
        </button>
      </div>
    </main>
  );
}
