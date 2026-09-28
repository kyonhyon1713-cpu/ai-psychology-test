export type Trait =
  | "imagination"
  | "relationship"
  | "structure"
  | "emotion"
  | "exploration";

export interface ScoreWeights {
  imagination?: number;
  relationship?: number;
  structure?: number;
  emotion?: number;
  exploration?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  scores: ScoreWeights;
}

export interface Question {
  id: number;
  image: string;
  question: string;
  options: QuestionOption[];
}

export const questions: Question[] = [
  {
    id: 1,
    image: "/images/q1.png",
    question: "이 그림을 보자마자 가장 먼저 떠오르는 것은 무엇인가요?",
    options: [
      {
        id: "A",
        text: "날개를 펼친 새나 나비 같은 생명체",
        scores: { imagination: 2, exploration: 1 },
      },
      {
        id: "B",
        text: "두 사람이 서로 마주 보고 있는 모습",
        scores: { relationship: 2, emotion: 1 },
      },
      {
        id: "C",
        text: "좌우가 맞물린 기계나 장치",
        scores: { structure: 2, imagination: 1 },
      },
      {
        id: "D",
        text: "강한 표정을 가진 얼굴이나 감정적인 장면",
        scores: { emotion: 2, relationship: 1 },
      },
      {
        id: "E",
        text: "정확히 설명하기 어려운 낯선 생명체나 형상",
        scores: { exploration: 2, structure: 1 },
      },
    ],
  },

  {
    id: 2,
    image: "/images/q2.png",
    question: "그림 전체를 하나의 장면이라고 생각하면 무엇에 가장 가까운가요?",
    options: [
      {
        id: "A",
        text: "하나의 이야기가 시작되는 상상의 공간",
        scores: { imagination: 2, relationship: 1 },
      },
      {
        id: "B",
        text: "여러 존재가 함께 무엇인가 하고 있는 장면",
        scores: { relationship: 2, structure: 1 },
      },
      {
        id: "C",
        text: "일정한 규칙으로 조립된 구조물",
        scores: { structure: 2, emotion: 1 },
      },
      {
        id: "D",
        text: "분위기가 강하게 느껴지는 풍경",
        scores: { emotion: 2, exploration: 1 },
      },
      {
        id: "E",
        text: "처음 보는 세계나 미지의 장소",
        scores: { exploration: 2, imagination: 1 },
      },
    ],
  },

  {
    id: 3,
    image: "/images/q3.png",
    question: "그림의 중앙 부분에서 가장 눈에 들어오는 것은 무엇인가요?",
    options: [
      {
        id: "A",
        text: "상징이나 문양처럼 보이는 형태",
        scores: { imagination: 2, structure: 1 },
      },
      {
        id: "B",
        text: "얼굴이나 사람의 몸처럼 보이는 부분",
        scores: { relationship: 2, exploration: 1 },
      },
      {
        id: "C",
        text: "명확하게 구분되는 선과 경계",
        scores: { structure: 2, relationship: 1 },
      },
      {
        id: "D",
        text: "부드럽거나 강렬하게 느껴지는 분위기",
        scores: { emotion: 2, imagination: 1 },
      },
      {
        id: "E",
        text: "무엇인지 규정하기 어려운 독특한 형태",
        scores: { exploration: 2, emotion: 1 },
      },
    ],
  },

  {
    id: 4,
    image: "/images/q4.png",
    question: "이 그림이 움직인다고 상상한다면 어떤 모습일까요?",
    options: [
      {
        id: "A",
        text: "형태가 계속 다른 모습으로 변할 것 같다",
        scores: { imagination: 2, emotion: 1 },
      },
      {
        id: "B",
        text: "두 존재가 서로 다가가거나 멀어질 것 같다",
        scores: { relationship: 2, imagination: 1 },
      },
      {
        id: "C",
        text: "여러 부분이 일정한 방향으로 움직일 것 같다",
        scores: { structure: 2, exploration: 1 },
      },
      {
        id: "D",
        text: "빠르게 흔들리거나 감정적으로 요동칠 것 같다",
        scores: { emotion: 2, structure: 1 },
      },
      {
        id: "E",
        text: "예상하지 못한 방향으로 움직일 것 같다",
        scores: { exploration: 2, relationship: 1 },
      },
    ],
  },

  {
    id: 5,
    image: "/images/q5.png",
    question: "이 그림에서 가장 중요한 부분을 하나 고른다면 무엇인가요?",
    options: [
      {
        id: "A",
        text: "전체 그림이 만들어내는 독특한 이미지",
        scores: { imagination: 2, exploration: 1 },
      },
      {
        id: "B",
        text: "사람이나 생명체로 보이는 부분",
        scores: { relationship: 2, emotion: 1 },
      },
      {
        id: "C",
        text: "좌우의 균형과 형태",
        scores: { structure: 2, imagination: 1 },
      },
      {
        id: "D",
        text: "그림에서 느껴지는 분위기",
        scores: { emotion: 2, relationship: 1 },
      },
      {
        id: "E",
        text: "다른 것과 닮지 않은 특이한 부분",
        scores: { exploration: 2, structure: 1 },
      },
    ],
  },

  {
    id: 6,
    image: "/images/q6.png",
    question: "이 그림에 제목을 붙인다면 어떤 종류의 제목이 가장 어울릴까요?",
    options: [
      {
        id: "A",
        text: "이야기를 상상할 수 있는 제목",
        scores: { imagination: 2, relationship: 1 },
      },
      {
        id: "B",
        text: "등장인물이나 관계를 표현하는 제목",
        scores: { relationship: 2, structure: 1 },
      },
      {
        id: "C",
        text: "형태나 구조를 설명하는 제목",
        scores: { structure: 2, emotion: 1 },
      },
      {
        id: "D",
        text: "감정이나 분위기를 표현하는 제목",
        scores: { emotion: 2, exploration: 1 },
      },
      {
        id: "E",
        text: "의미가 명확하지 않은 독특한 제목",
        scores: { exploration: 2, imagination: 1 },
      },
    ],
  },

  {
    id: 7,
    image: "/images/q7.png",
    question: "그림을 조금 더 자세히 바라보았을 때 처음과 비교해 어떻게 느껴지나요?",
    options: [
      {
        id: "A",
        text: "처음에는 없던 새로운 이미지가 떠오른다",
        scores: { imagination: 2, structure: 1 },
      },
      {
        id: "B",
        text: "사람이나 생명체 사이의 관계가 더 보인다",
        scores: { relationship: 2, exploration: 1 },
      },
      {
        id: "C",
        text: "처음보다 형태와 규칙이 더 분명하게 보인다",
        scores: { structure: 2, relationship: 1 },
      },
      {
        id: "D",
        text: "그림이 주는 느낌이나 분위기가 더 강해진다",
        scores: { emotion: 2, imagination: 1 },
      },
      {
        id: "E",
        text: "보면 볼수록 새로운 가능성이 생긴다",
        scores: { exploration: 2, emotion: 1 },
      },
    ],
  },

  {
    id: 8,
    image: "/images/q8.png",
    question: "이 그림이 어떤 장소에 존재한다고 생각하면 어디에 가장 어울릴까요?",
    options: [
      {
        id: "A",
        text: "꿈이나 상상 속 공간",
        scores: { imagination: 2, emotion: 1 },
      },
      {
        id: "B",
        text: "사람들이 모여 있는 공간",
        scores: { relationship: 2, imagination: 1 },
      },
      {
        id: "C",
        text: "공장, 건축물 또는 복잡한 구조 내부",
        scores: { structure: 2, exploration: 1 },
      },
      {
        id: "D",
        text: "분위기가 강한 어둡거나 고요한 공간",
        scores: { emotion: 2, structure: 1 },
      },
      {
        id: "E",
        text: "아직 발견되지 않은 낯선 세계",
        scores: { exploration: 2, relationship: 1 },
      },
    ],
  },

  {
    id: 9,
    image: "/images/q9.png",
    question: "이 그림을 다른 사람에게 설명한다면 무엇부터 말할 것 같나요?",
    options: [
      {
        id: "A",
        text: "무엇처럼 보이는지부터 설명한다",
        scores: { imagination: 2, exploration: 1 },
      },
      {
        id: "B",
        text: "누가 무엇을 하는 것처럼 보이는지 설명한다",
        scores: { relationship: 2, emotion: 1 },
      },
      {
        id: "C",
        text: "어떤 모양과 구조로 되어 있는지 설명한다",
        scores: { structure: 2, imagination: 1 },
      },
      {
        id: "D",
        text: "어떤 느낌을 주는지부터 설명한다",
        scores: { emotion: 2, relationship: 1 },
      },
      {
        id: "E",
        text: "이상하고 독특한 부분이 무엇인지 설명한다",
        scores: { exploration: 2, structure: 1 },
      },
    ],
  },

  {
    id: 10,
    image: "/images/q10.png",
    question: "이런 종류의 그림을 볼 때 가장 자연스럽게 하는 행동은 무엇인가요?",
    options: [
      {
        id: "A",
        text: "여러 가지 모습을 상상해 본다",
        scores: { imagination: 2, relationship: 1 },
      },
      {
        id: "B",
        text: "사람이나 생명체를 먼저 찾아본다",
        scores: { relationship: 2, structure: 1 },
      },
      {
        id: "C",
        text: "좌우 대칭이나 모양을 자세히 살펴본다",
        scores: { structure: 2, emotion: 1 },
      },
      {
        id: "D",
        text: "그림에서 어떤 느낌이 드는지 생각한다",
        scores: { emotion: 2, exploration: 1 },
      },
      {
        id: "E",
        text: "남들이 생각하지 않을 만한 다른 해석을 찾아본다",
        scores: { exploration: 2, imagination: 1 },
      },
    ],
  },
];