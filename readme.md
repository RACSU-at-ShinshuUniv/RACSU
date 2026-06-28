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

## 初期設定
### Firebase関連
```bash
> firebase init
```

Firestore, Functions, Hosting((optionally) set up GitHub Action deploys)を選択し、以下の通り設定。

```bash
=== Firestore Setup

Firestore Security Rules allow you to define how and when to allow
requests. You can keep these rules in your project directory
and publish them with firebase deploy.

? What file should be used for Firestore Rules? firestore.rules
? File firestore.rules already exists. Do you want to overwrite it with the Firestore Rules from the Firebase Console? No

Firestore indexes allow you to perform complex queries while
maintaining performance that scales with the size of the result
set. You can keep index definitions in your project directory
and publish them with firebase deploy.

? What file should be used for Firestore indexes? firestore.indexes.json
? File firestore.indexes.json already exists. Do you want to overwrite it with the Firestore Indexes from the Firebase Console? No
```

```bash
=== Functions Setup

Detected existing codebase(s): default

? Would you like to initialize a new codebase, or overwrite an existing one? Overwrite

Overwriting codebase default...

? What language would you like to use to write Cloud Functions? JavaScript
? Do you want to use ESLint to catch probable bugs and enforce style? No
? File functions/package.json already exists. Overwrite? No
i  Skipping write of functions/package.json
? File functions/index.js already exists. Overwrite? No
i  Skipping write of functions/index.js
+  Wrote functions/.gitignore
? Do you want to install dependencies with npm now? Yes
```

```bash
=== Hosting Setup

Your public directory is the folder (relative to your project directory) that
will contain Hosting assets to be uploaded with firebase deploy. If you
have a build process for your assets, use your build's output directory.

? What do you want to use as your public directory? hosting/out
? Configure as a single-page app (rewrite all urls to /index.html)? No
? Set up automatic builds and deploys with GitHub? No
+  Wrote hosting/404.html
+  Wrote hosting/index.html
```

### Firebaseプロジェクト追加
```bash
> firebase use --add default
> firebase use --add production
```


## ライセンス
本サービスはオープンソース（Apache-2.0 License）で開発中です。