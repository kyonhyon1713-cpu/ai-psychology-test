import { questions } from "@/data/questions";
import type { Trait } from "@/data/questions";
import { getResultTypeProfile } from "@/data/resultTypes";

export type Answers = Record<number, string>;

const traitList: Trait[] = [
  "imagination",
  "relationship",
  "structure",
  "emotion",
  "exploration",
];

export function calculateResult(answers: Answers) {
  // 1. 원점수 초기화
  const rawScores: Record<Trait, number> = {
    imagination: 0,
    relationship: 0,
    structure: 0,
    emotion: 0,
    exploration: 0,
  };

  // 2. 사용자가 고른 선택지의 점수 합산
  for (const question of questions) {
    const selectedOptionId = answers[question.id];

    const selectedOption = question.options.find(
      (option) => option.id === selectedOptionId
    );

    if (!selectedOption) continue;

    for (const trait of traitList) {
      rawScores[trait] += selectedOption.scores[trait] ?? 0;
    }
  }

  // 3. 0~100 점수로 변환
  const normalizedScores: Record<Trait, number> = {
    imagination: 0,
    relationship: 0,
    structure: 0,
    emotion: 0,
    exploration: 0,
  };

  // 한 성향은 문항당 최대 2점 × 10문항 = 최대 20점
  for (const trait of traitList) {
    normalizedScores[trait] = Math.round(
      (rawScores[trait] / 20) * 100
    );
  }

  // 4. 점수가 높은 순서대로 정렬
  // 동점이면 traitList의 고정 순서대로 우선합니다.
  // imagination → relationship → structure → emotion → exploration
  const sortedTraits = [...traitList].sort(
    (a, b) =>
      rawScores[b] - rawScores[a] ||
      traitList.indexOf(a) - traitList.indexOf(b)
  );

  // 5. 상위 2개 성향
  const topTraits = [
    sortedTraits[0],
    sortedTraits[1],
  ] as [Trait, Trait];

  // 6. 상위 2개 성향으로 결과 유형 결정
  const profile = getResultTypeProfile(topTraits);

  // 7. 최종 결과 반환
  return {
    rawScores,
    normalizedScores,
    topTraits,
    resultType: profile.name,
    summary: profile.summary,
  };
}

export type CalculatedResult = ReturnType<typeof calculateResult>;