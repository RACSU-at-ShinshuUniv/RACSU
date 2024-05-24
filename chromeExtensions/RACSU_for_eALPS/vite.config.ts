import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx, defineManifest } from '@crxjs/vite-plugin'
import path from 'path';

const manifest = defineManifest({
  name: "RACSU for eALPS",
  description: "eALPS登録課題を一覧表示します。この拡張機能は、「eALPS支援ツール」として信州大学e-Learningセンターに認定申請中です。",
  version: "1.2.1",
  manifest_version: 3,
  permissions: ["alarms", "storage", "unlimitedStorage"],
  host_permissions: ["https://lms.ealps.shinshu-u.ac.jp/*/*/calendar/*", "https://campus-3.shinshu-u.ac.jp/syllabusj/*"],
  icons: {
    16: "icon/icon16.png",
    48: "icon/icon48.png",
    128: "icon/icon128.png"
  },
  background: {
    service_worker: "src/background.ts",
    type: "module"
  },
  action: {
    default_popup: "pages/popup/index.html"
  },
  content_scripts: [{
    matches: ["https://lms.ealps.shinshu-u.ac.jp/*/*/calendar/export.php"],
    js: ["src/autoSetting.js"],
    run_at: "document_end"
  },{
    matches: ["https://timetable.ealps.shinshu-u.ac.jp/portal/"],
    js: ["src/loadFrame.js"]
  }],
  options_page: "pages/options/index.html",
  web_accessible_resources: [{
    resources: ["pages/*"],
    matches: ["<all_urls>"]
  }]
});

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        // defineManifestで指定したファイルは自動でコンパイル対象になる
        // それ以外にコンパイルしたいファイルがあれば記述
        portal: path.resolve(__dirname, 'pages/portal/index.html')
      }
    },
  },
});