import type { Metadata } from "next";
import { Noto_Sans_JP } from 'next/font/google'
import "../common/design.css";

import Header from "../common/component/Header";
import Footer from "../common/component/Footer";

const noteSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: "normal",
  variable: '--font-noto-sans-jp'
});

export const metadata: Metadata = {
  title: {
    template: '%s | RACSU for eALPS',
    default: 'ホーム | RACSU for eALPS',
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ja" className={noteSansJP.className}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
