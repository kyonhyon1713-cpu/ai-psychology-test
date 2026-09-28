"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { questions } from "@/data/questions";
import { calculateResult, type Answers } from "@/lib/scoring";

const RESULT_STORAGE_KEY = "abstract-perception-result";

export default function TestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const currentQuestion = questions[currentIndex];
  const selectedOption = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  function selectAnswer(optionId: string) {
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: optionId,
    }));
  }

  function goToPrevious() {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function goToNext() {
    if (!selectedOption) return;

    if (isLastQuestion) {
      const result = calculateResult(answers);
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
      router.push("/result");
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  return (
    <main className="test-shell">
      <header className="test-header">
        <Link className="brand-link" href="/" aria-label="내면의 결 홈으로 이동">
          내면의 결
        </Link>
        <p className="progress-count" aria-label={`${questions.length}문항 중 ${currentIndex + 1}번째`}>
          <strong>{String(currentIndex + 1).padStart(2, "0")}</strong>
          {` / ${String(questions.length).padStart(2, "0")}`}
        </p>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="테스트 진행률"
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-valuenow={currentIndex + 1}
          aria-valuetext={`${questions.length}문항 중 ${currentIndex + 1}번째`}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <section className="question-card" key={currentQuestion.id}>
        <div className="question-grid">
          <div className="question-image-wrap">
            <Image
              className="question-image"
              src={currentQuestion.image}
              alt={`${currentQuestion.id}번 문항의 추상 이미지`}
              width={1024}
              height={1024}
              priority
              sizes="(max-width: 800px) 100vw, 420px"
            />
          </div>

          <div className="question-content">
            <p className="question-kicker">QUESTION {String(currentQuestion.id).padStart(2, "0")}</p>
            <h1 className="question-title">{currentQuestion.question}</h1>

            <fieldset className="options-list">
              <legend className="sr-only">답변 선택</legend>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option.id;

                return (
                  <label
                    className={`option-card${isSelected ? " selected" : ""}`}
                    key={option.id}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.id}
                      checked={isSelected}
                      onChange={() => selectAnswer(option.id)}
                    />
                    <span className="option-letter" aria-hidden="true">
                      {option.id}
                    </span>
                    <span className="option-text">{option.text}</span>
                  </label>
                );
              })}
            </fieldset>
          </div>
        </div>
      </section>

      <nav className="test-nav" aria-label="문항 이동">
        <button
          className="secondary-button"
          type="button"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          ← 이전
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={goToNext}
          disabled={!selectedOption}
        >
          {isLastQuestion ? "결과 보기" : "다음 →"}
        </button>
      </nav>
    </main>
  );
}
