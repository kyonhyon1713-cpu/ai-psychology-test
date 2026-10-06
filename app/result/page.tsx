"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Trait } from "@/data/questions";
import type { CalculatedResult } from "@/lib/scoring";
import { getResultTypeProfile } from "@/data/resultTypes";

const RESULT_STORAGE_KEY = "abstract-perception-result";

const traitLabels: Record<Trait, string> = {
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

function isStoredResult(
  value: unknown
): value is CalculatedResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate =
    value as Partial<CalculatedResult>;

  return (
    typeof candidate.resultType === "string" &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.topTraits) &&
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

export default function ResultPage() {
  const [result, setResult] =
    useState<CalculatedResult | null>(null);

  const [isReady, setIsReady] =
    useState(false);

  const hasInitialized = useRef(false);

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

  function restartTest() {
    sessionStorage.removeItem(
      RESULT_STORAGE_KEY
    );
  }

  if (!isReady) {
    return (
      <main className="result-shell">
        <section
          className="empty-card"
          aria-live="polite"
        >
          <div
            className="loading-orbit"
            aria-hidden="true"
          />

          <p>결과를 불러오고 있습니다...</p>
        </section>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="result-shell">
        <section className="empty-card">
          <h1>아직 결과가 없습니다</h1>

          <p>
            10개의 문항에 답하면 당신만의
            해석 성향을 확인할 수 있어요.
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

  return (
    <main className="result-shell">
      {/* 결과 유형 */}

      <header className="result-header">
        <p className="result-overline">
          YOUR PERCEPTION TYPE
        </p>

        <h1>{profile.name}</h1>

        <p className="result-summary">
          {profile.summary}
        </p>

        <div className="result-top-traits" aria-label="상위 두 성향">
          {result.topTraits.map((trait, index) => (
            <div className="result-top-trait" key={trait}>
              <span className="result-top-rank">
                TOP {String(index + 1).padStart(2, "0")}
              </span>
              <div className="result-top-value">
                <span>{trait.toUpperCase()}</span>
                <strong>{traitLabels[trait]}</strong>
                <b>{result.normalizedScores[trait]}</b>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* 상세 성향 */}

      <section
        className="profile-section"
        aria-labelledby="profile-heading"
      >
        <div className="profile-section-header">
          <span className="profile-eyebrow">
            YOUR PATTERN
          </span>

          <h2 id="profile-heading">
            이 유형은 어떻게 나타날까요?
          </h2>

          <p>
            응답에서 두드러진 성향을
            바탕으로 생각과 관계, 감정,
            행동의 경향을 정리했어요.
          </p>
        </div>

        <div className="profile-grid">
          {/* 판단 방식 */}

          <article className="profile-card">
            <div className="profile-card-title">
              <span
                className="profile-icon"
                aria-hidden="true"
              >
                🧠
              </span>

              <h3>판단 방식</h3>
            </div>

            <p>{profile.judgment}</p>
          </article>

          {/* 관계 방식 */}

          <article className="profile-card">
            <div className="profile-card-title">
              <span
                className="profile-icon"
                aria-hidden="true"
              >
                🤝
              </span>

              <h3>관계 방식</h3>
            </div>

            <p>{profile.relationship}</p>
          </article>

          {/* 감정과 분위기 */}

          <article className="profile-card">
            <div className="profile-card-title">
              <span
                className="profile-icon"
                aria-hidden="true"
              >
                🌙
              </span>

              <h3>감정과 분위기</h3>
            </div>

            <p>{profile.emotion}</p>
          </article>

          {/* 행동 방식 */}

          <article className="profile-card">
            <div className="profile-card-title">
              <span
                className="profile-icon"
                aria-hidden="true"
              >
                🧭
              </span>

              <h3>행동 방식</h3>
            </div>

            <p>{profile.behavior}</p>
          </article>
        </div>

        {/* 강점 / 주의점 */}

        <div className="profile-bottom-grid">
          <article className="profile-list-card strength-card">
            <div className="profile-card-title">
              <span
                className="profile-icon"
                aria-hidden="true"
              >
                ✨
              </span>

              <h3>강점</h3>
            </div>

            <ul>
              {profile.strengths.map(
                (strength) => (
                  <li key={strength}>
                    {strength}
                  </li>
                )
              )}
            </ul>
          </article>

          <article className="profile-list-card caution-card">
            <div className="profile-card-title">
              <span
                className="profile-icon"
                aria-hidden="true"
              >
                💡
              </span>

              <h3>주의할 점</h3>
            </div>

            <ul>
              {profile.cautions.map(
                (caution) => (
                  <li key={caution}>
                    {caution}
                  </li>
                )
              )}
            </ul>
          </article>
        </div>
      </section>

      {/* 성향 스펙트럼 */}

      <section
        className="result-card"
        aria-labelledby="score-heading"
      >
        <div className="section-heading">
          <h2 id="score-heading">
            나의 성향 스펙트럼
          </h2>

          <span>100점 기준</span>
        </div>

        <div className="trait-list">
          {traitOrder.map((trait) => {
            const isTopTrait =
              result.topTraits.includes(
                trait
              );

            const score =
              result.normalizedScores[
                trait
              ];

            return (
              <div
                className={`trait-row${
                  isTopTrait
                    ? " is-top"
                    : ""
                }`}
                key={trait}
              >
                <div className="trait-name">
                  {traitLabels[trait]}

                  {isTopTrait && (
                    <span className="top-badge">
                      TOP
                    </span>
                  )}
                </div>

                <div className="trait-score">
                  {score}
                </div>

                <div
                  className="score-track"
                  role="progressbar"
                  aria-label={`${traitLabels[trait]} 점수`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={score}
                >
                  <div
                    className="score-fill"
                    style={{
                      width: `${score}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI 페이지 이동 */}

      <section
        className="image-card"
        style={{
          marginTop: "24px",
          textAlign: "center",
        }}
      >
        <div className="image-card-header">
          <h2>
            AI가 표현하는 나의 내면 풍경
          </h2>

          <p>
            당신의 결과 유형과 성향을
            바탕으로 하나의 추상적인
            이미지를 만들어볼 수 있어요.
          </p>
        </div>

        <Link
          className="primary-button"
          href="/result/image"
        >
          AI로 내면 풍경 만들기 →
        </Link>
      </section>

      {/* 다시 테스트 */}

      <div className="result-actions">
        <Link
          className="ghost-button"
          href="/test"
          onClick={restartTest}
        >
          다시 테스트하기
        </Link>
      </div>
    </main>
  );
}
