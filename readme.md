# 信大生向け 課題通知サービスRACSU

## 基本機能

## 開発上での問題点と解決策

### github上に機密情報をプッシュしてしまった

https://tex2e.github.io/blog/git/filter-branch を参考に、過去の履歴から該当ファイルを削除する。

```bash
git filter-branch --index-filter 'git rm --cached --ignore-unmatch {ファイル名の相対パス}' HEAD
```

その後、--forceオプションでローカルの変更を同期させる。

```bash
git push --force origin ブランチ名
```

### Firestoreの初回起動時のレスポンスが遅い

Firestoreの初期化部分はindexファイルの中で行うことで改善した。

```javascript
const { getFirestore } = require('firebase-admin/firestore');
// 以前はこれを含め、firestore操作を一つのモジュールに纏めて読み込む形を取っていた。
// それをやめ、初期化をindexファイル内で行うことで解決した。
```