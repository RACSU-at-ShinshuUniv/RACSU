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
  description: "RACSU for eALPSで、提出忘れとおさらばしよう。eALPSと連携して、課題を自動で一覧表示・提出管理できます。",
  openGraph: {
    title: 'ホーム | RACSU for eALPS',
    description: 'RACSU for eALPSで、提出忘れとおさらばしよう。eALPSと連携して、課題を自動で一覧表示・提出管理できます。',
    images: ['/screenshot.jpg'],
    url: 'https://racsu-shindai.web.app/'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@RACSU_shindai',
    title: 'ホーム | RACSU for eALPS',
    description: 'RACSU for eALPSで、提出忘れとおさらばしよう。eALPSと連携して、課題を自動で一覧表示・提出管理できます。',
    images: '/screenshot.jpg'
  }
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
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
      <GoogleAnalytics gaId="G-JPBLDM47DT" />
    </html>
  );
}
