/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID: string
  readonly VITE_GA_API_SECRET: string
  // その他の環境変数...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}