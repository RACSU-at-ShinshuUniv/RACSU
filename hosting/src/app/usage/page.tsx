import { Box } from "@mui/material";
import url from "@/url.json";

export default function App() {
  return (
    <main>
      <Box display="flex" alignItems="center" justifyContent="center" height="90vh" flexWrap="wrap">
        <p>使い方のページは現在準備中です。<br />
        <a href={url.store} target="_blank">こちら</a>からインストールし、画面に従ってセットアップしてください。</p>
      </Box>
    </main>
  );
}
