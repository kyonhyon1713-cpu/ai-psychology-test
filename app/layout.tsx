import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "내면의 결 | 추상 이미지 성향 테스트",
  description: "추상 이미지를 바라보는 방식으로 나의 해석 성향을 발견해보세요.",
  applicationName: "내면의 결",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "내면의 결",
    title: "내면의 결 | 추상 이미지 성향 테스트",
    description: "추상 이미지를 바라보는 방식으로 나의 해석 성향을 발견해보세요.",
  },
  twitter: {
    card: "summary",
    title: "내면의 결 | 추상 이미지 성향 테스트",
    description: "추상 이미지를 바라보는 방식으로 나의 해석 성향을 발견해보세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
