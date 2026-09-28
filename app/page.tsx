import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="home-card">
        <p className="eyebrow">ABSTRACT PERCEPTION TEST</p>
        <div className="home-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1>내면의 결</h1>
        <p className="home-lead">
          같은 이미지도 저마다 다르게 보입니다.
          <br />
          10개의 추상 이미지를 따라 당신만의 해석 방식을 발견해보세요.
        </p>
        <p className="home-meta">10문항 · 약 3분</p>
        <Link className="primary-button home-cta" href="/test">
          테스트 시작하기
          <span aria-hidden="true">→</span>
        </Link>
        <p className="disclaimer">
          본 테스트는 자기 탐색을 위한 콘텐츠이며 의학적 진단을 제공하지 않습니다.
        </p>
      </section>
    </main>
  );
}
