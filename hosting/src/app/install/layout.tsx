import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "インストール"
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (children);
}