# AI 심리결과 시각화 웹앱 - OpenAI 유료 이미지 버전 구현 가이드

## 프로젝트 개요

이 프로젝트는 추상 이미지 기반 객관식 테스트 결과를 바탕으로,

규칙 기반으로 성향 점수와 결과 유형을 계산하고,

최종적으로 OpenAI 이미지 생성 API를 사용해

사용자의 결과를 상징적인 그림으로 시각화하는 웹앱이다.

중요한 원칙:

- AI는 심리 결과를 해석하지 않는다.

- AI는 점수를 계산하지 않는다.

- AI는 오직 최종 결과 이미지를 생성하는 데만 사용된다.

- 점수 계산과 결과 설명은 모두 사전에 정의한 규칙 기반 로직으로 처리한다.

---

## 핵심 기능 요구사항

### 테스트 구조

- 총 10문항

- 각 문항은 추상 이미지 1장과 객관식 선택지 5개로 구성

- 사용자는 문항마다 1개의 선택지만 선택 가능

- 이전 / 다음 이동 가능

- 진행률 표시

### 성향 축

5개의 성향 축을 사용한다.

1. 상상적 해석 (imagination)

2. 관계적 해석 (relationship)

3. 구조적 인식 (structure)

4. 정서적 반응 (emotion)

5. 탐색적 해석 (exploration)

### 대표 상징물

- 상상적 해석 → 나비 (butterflies)

- 관계적 해석 → 연결된 두 개의 고리 (two connected rings)

- 구조적 인식 → 기하학적 문 (a geometric door)

- 정서적 반응 → 물결 (flowing waves)

- 탐색적 해석 → 길 (a path)

### 결과 생성 방식

- 선택지마다 사전 정의된 점수를 부여한다.

- 점수를 합산하여 5개 성향 점수를 계산한다.

- 가장 높은 2개 성향을 기반으로 결과 유형을 결정한다.

- 결과 설명은 템플릿 기반으로 출력한다.

- 최종 AI 이미지는 결과 유형과 상위 2개 성향을 기반으로 생성한다.

---

## 기술 요구사항

### 권장 스택

- Frontend: React 또는 Next.js

- Backend: Node.js + Express 또는 Next.js API Routes

- State management: 기본 React state 또는 Zustand

- Styling: Tailwind CSS 또는 CSS Modules

- Image API: OpenAI Image API

- Environment variables 사용 필수

### 보안 원칙

- OpenAI API key는 절대 프론트엔드에 노출하지 않는다.

- 모든 OpenAI API 호출은 백엔드에서만 수행한다.

---

## Orca 구현 프롬프트 1 - 전체 프로젝트 뼈대 생성

Create a responsive full-stack web app for an abstract image personality test.

Project goal:

Users complete a 10-question multiple-choice test based on abstract inkblot-like images.

The app calculates personality-style tendency scores using predefined rule-based scoring.

The app then generates one symbolic result image using OpenAI's paid image generation API.

Important rules:

- AI must NOT analyze user psychology.

- AI must NOT calculate scores.

- AI must NOT determine the result type.

- AI is used ONLY to generate the final symbolic result image.

- All scoring and personality result logic must be deterministic and rule-based.

Pages to build:

1. Landing page

- App title

- Short description

- Start button

- Notice that this is a self-exploration experience, not a clinical diagnosis

2. Test page

- Show one question at a time

- Show image, question text, and 5 answer options

- Previous / Next buttons

- Progress indicator

- Preserve user answers while navigating

3. Loading page

- Show that results are being prepared

- Then request final result image from backend

4. Result page

- Show result type

- Show summary

- Show 5 tendency scores

- Show rule-based result description

- Show generated symbolic result image

- Retry image generation button

- Retake test button

Use a clean, calm, slightly mysterious design.

Prefer minimal UI with off-white, charcoal, gray, and subtle purple accents.

Keep the question data, scoring logic, result logic, and image prompt generation logic in separate modules.

---

## Orca 구현 프롬프트 2 - 문항 데이터 및 점수 로직 구현

Implement the question data and scoring engine.

Requirements:

- There are 10 questions.

- Each question has 5 options.

- Each option has deterministic score weights for the 5 tendency dimensions:

  imagination, relationship, structure, emotion, exploration

Use a structured JSON or TypeScript object format.

Each option should store:

- option text

- score weights object

Example format:

{

  id: 1,

  question: "이 그림을 보자마자 가장 먼저 떠오르는 것은 무엇인가요?",

  image: "/images/q1.png",

  options: [

    {

      id: "A",

      text: "날개를 펼친 새나 나비 같은 생명체",

      scores: { imagination: 2, exploration: 1 }

    },

    {

      id: "B",

      text: "두 사람이 서로 마주 보고 있는 모습",

      scores: { relationship: 2, emotion: 1 }

    }

  ]

}

Create a scoring engine that:

1. Receives all selected answers

2. Sums raw scores for each dimension

3. Converts raw scores into normalized 0-100 values

4. Determines the top two dimensions

5. Returns a result object

Result object format example:

{

  rawScores: {

    imagination: 14,

    relationship: 8,

    structure: 12,

    emotion: 6,

    exploration: 10

  },

  normalizedScores: {

    imagination: 70,

    relationship: 40,

    structure: 60,

    emotion: 30,

    exploration: 50

  },

  topTraits: ["imagination", "structure"],

  resultType: "패턴을 읽는 탐험가"

}

The same answers must always produce the same result.

---

## Orca 구현 프롬프트 3 - 결과 설명 템플릿 구현

Implement deterministic result descriptions without AI.

Requirements:

- Do not use AI to write explanations.

- Use predefined Korean templates only.

- Show:

  1. result type

  2. one-sentence summary

  3. descriptions for top 3 tendencies

  4. a disclaimer

Create:

- description templates for each tendency

- summary templates for top-2 trait combinations

- result type mapping table for top-2 trait combinations

Example:

- imagination + structure = "패턴을 읽는 탐험가"

- relationship + emotion = "감정을 비추는 관찰자"

- exploration + imagination = "미지를 향한 몽상가"

Show a disclaimer:

"이 결과는 추상 이미지에 대한 선택 패턴을 바탕으로 구성된 자기탐색용 콘텐츠이며 전문적인 심리검사 또는 진단을 의미하지 않습니다."

Do not use clinical or diagnostic wording.

---

## Orca 구현 프롬프트 4 - OpenAI 이미지 생성 백엔드 구현

Implement a backend endpoint that generates the final symbolic result image using OpenAI's paid image generation API.

Important architecture rules:

- The frontend sends resultType, topTraits, and normalizedScores to the backend.

- The backend builds the image prompt deterministically.

- The backend securely calls OpenAI Image API using a server-side environment variable.

- The API key must never be exposed to the frontend.

- Return the generated image URL or image data to the frontend.

Trait-to-object mapping:

- imagination -&gt; butterflies

- relationship -&gt; two connected rings

- structure -&gt; a geometric door

- emotion -&gt; flowing waves

- exploration -&gt; a path

Prompt generation requirements:

- Generate the final image prompt in English

- The image must be symbolic, artistic, dreamlike, and introspective

- The top two traits determine the two main symbolic objects

- The image must contain no text

- No medical or diagnostic imagery

- No UI elements or letters

If the image generation fails:

- Return an error response

- The frontend should show a fallback placeholder image

- The frontend should allow retry

---

## Orca 구현 프롬프트 5 - 이미지 프롬프트 생성 모듈 구현

Create a backend utility module that builds the final English image-generation prompt from the result data.

Input:

- resultType

- topTraits

- normalizedScores

Output:

- one final English prompt string

Use this structure:

Create a symbolic and artistic psychological result image for a result type called "{resultType}".

This image represents a user's interpretation style from an abstract image personality test.

Primary traits:

- {trait1}

- {trait2}

Core symbolic objects:

- {object1}

- {object2}

Scores:

- imagination: {imagination}/100

- relationship: {relationship}/100

- structure: {structure}/100

- emotion: {emotion}/100

- exploration: {exploration}/100

Make {object1} and {object2} the main visual focus.

Create a calm, dreamlike inner landscape.

Use elegant composition, subtle symmetry, and a refined surreal atmosphere.

No text, no letters, no UI elements, no medical imagery.

Also enrich the prompt using trait mood keywords:

- imagination: surreal, floating, symbolic

- relationship: connected, mirrored, relational

- structure: geometric, balanced, orderly

- emotion: flowing, atmospheric, soft

- exploration: path, horizon, discovery

---

## Orca 구현 프롬프트 6 - 결과 페이지와 이미지 로딩 UX 개선

Improve the result page UX.

Requirements:

- After the user completes the test, immediately show the text result first.

- Show a loading indicator for image generation.

- When the generated image is ready, display it below the result summary.

- If generation fails, keep all text results visible and show a fallback image or message.

- Add a "다시 생성하기" button to retry image generation.

- Add a "다시 테스트하기" button.

- Make sure loading, success, and failure states are clearly separated.

---

## 환경변수 예시

Use environment variables:

OPENAI_API_KEY=your_openai_api_key

OPENAI_IMAGE_MODEL=your_selected_image_model

Optional:

APP_ENV=development

---

## 폴더 구조 예시

src/

  components/

    LandingPage.tsx

    TestPage.tsx

    ResultPage.tsx

    ScoreBar.tsx

  data/

    questions.ts

    resultTypes.ts

    descriptionTemplates.ts

  lib/

    scoring.ts

    resultEngine.ts

    imagePromptBuilder.ts

  pages/ or app/

    index.tsx

    test.tsx

    result.tsx

  server/

    routes/

      generateResultImage.ts

  public/

    images/

      q1.png

      q2.png

      ...

      fallback-result.png

---

## 구현 시 주의사항

- 테스트 문항용 추상 이미지는 고정 이미지로 사용한다.

- AI는 오직 최종 결과 이미지 1장만 생성한다.

- API 호출은 결과 페이지에서 1회만 수행한다.

- 프롬프트는 항상 deterministic하게 생성한다.

- 같은 결과 유형과 점수라면 유사한 프롬프트가 생성되어야 한다.

- UI는 심리 진단 서비스처럼 과장하지 않는다.

- "자기탐색", "인지·해석 성향", "결과 시각화"라는 표현을 사용한다.

---

## 최종 목표

완성된 앱은 다음을 만족해야 한다.

1. 사용자가 10문항 테스트를 진행할 수 있다.

2. 규칙 기반으로 결과를 계산한다.

3. AI 없이 결과 텍스트를 출력한다.

4. OpenAI 유료 이미지 생성 API로 결과 이미지를 1장 생성한다.

5. 결과 화면에서 텍스트 + 이미지가 함께 제공된다.