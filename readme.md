# 信州大学 eALPS機能拡張 RACSU for eALPS
## 概要
本サービスは、信州大学e-LearningシステムeALPSの機能を拡張するものです。<br>
信州大学在学中の学生によって運営されています。

> [!NOTE]
> 本サービスは、信州大学e-Learningセンター eALPS支援ツール認定制度「eALPluS」の認定事案です。<br>
> 「eALPluS」制度について詳しくは[こちら](https://www.shinshu-u.ac.jp/institution/e-L/ealplus.html)をご覧ください。

## 使用言語・ライブラリ等
### 全体
- Javascript/Typescript
- [React](https://ja.react.dev/)
- [MUI](https://mui.com/)
- [Emotion](https://emotion.sh/docs/introduction)

### ホームページ
- Firebase Hosting
- [Nextjs](https://nextjs.org/)

### 拡張機能
- [dayjs](https://www.npmjs.com/package/dayjs)
- [Vite](https://ja.vitejs.dev/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)


## ディレクトリ構成
### Chrome/Edge拡張機能
eALPSポータルの時間割表の上部に課題一覧画面を挿入する拡張機能です。<br>
[Chrome拡張機能ストア](https://chromewebstore.google.com/detail/racsu-for-ealps/ecdlbalgeakgkbohkhcjcjbhbhjmekan)にて一般公開しています。

```
ディレクトリ：chromeExtensions/RACSU_for_eALPS/
```

### ホームページ
サービスのHPです。<br>
Firebase Hostingを使用してホスティングしています。
ホームページは[こちら](https://racsu-shindai.web.app/)。

```
ディレクトリ：hosting/
```

### 【サービス停止中】LINEアカウント
課題を確認・完了登録できるLINEアカウントです。<br>
Firebase Functionsを使用しています。<br>

> [!IMPORTANT]
>RACSU LINEアカウントは現在サービス停止中です。

```
ディレクトリ：functions/
```

## ライセンス
本サービスはオープンソース（Apache-2.0 License）で開発中です。