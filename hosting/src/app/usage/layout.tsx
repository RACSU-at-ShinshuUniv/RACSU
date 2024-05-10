import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使い方"
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (children);
}