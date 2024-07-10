/** @jsxImportSource @emotion/react */
"use client";

import { redirect } from 'next/navigation'
import url from "@/url.json"

export default function App() {
  redirect(url.store);
}
