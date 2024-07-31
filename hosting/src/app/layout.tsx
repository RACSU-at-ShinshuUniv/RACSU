import type { Metadata } from "next";
import { Noto_Sans_JP } from 'next/font/google'
import "@/design.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { GoogleAnalytics } from '@next/third-parties/google'

const noteSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: "normal",
  variable: '--font-noto-sans-jp'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://racsu-shindai.web.app/'),
  title: {
    template: '%s | RACSU for eALPS',
    default: 'ホーム | RACSU for eALPS',
  },
  description: "eALPSから課題を自動取得・ポータルに一覧表示します。RACSU for eALPSで、課題の提出忘れとおさらばしよう。"
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ja" className={noteSansJP.className}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#1b5aad" />
        <meta name="msapplication-TileColor" content="#1b5aad" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="google-site-verification" content="ZodySQReei3K1skGnBWnSpxBW-3UPlqq9CTj4xbQFAk" />

        <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# article: http://ogp.me/ns/article#" />
        <meta property="og:title" content="ホーム | RACSU for eALPS" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://racsu-shindai.web.app/" />
        <meta property="og:image" content="https://racsu-shindai.web.app/ogp.png" />
        <meta property="og:site_name" content="RACSU for eALPS" />
        <meta property="og:description" content="eALPSから課題を自動取得・ポータルに一覧表示します。RACSU for eALPSで、課題の提出忘れとおさらばしよう。" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <GoogleAnalytics gaId="G-JPBLDM47DT" />
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
