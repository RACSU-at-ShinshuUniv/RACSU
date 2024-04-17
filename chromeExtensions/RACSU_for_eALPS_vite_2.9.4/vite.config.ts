import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
  name: "RACSU for eALPS",
  description: "eALPS登録課題を一覧表示します。この拡張機能は、「eALPS支援ツール」として信州大学e-Learningセンターに認定申請中です。",
  version: "1.1.0",
  manifest_version: 3,
  permissions: ["alarms", "storage", "unlimitedStorage"],
  host_permissions: ["https://lms.ealps.shinshu-u.ac.jp/*/*/calendar/*", "https://campus-3.shinshu-u.ac.jp/syllabusj/*"],
  icons: {
    16: "src/common/image/icon16.png",
    48: "src/common/image/icon48.png",
    128: "src/common/image/icon128.png"
  },
  options_page: "index.html"
});


export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })]
})
