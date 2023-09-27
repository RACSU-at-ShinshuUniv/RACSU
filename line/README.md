# LINE リッチメニュー設定手順

リッチメニューエディタ（https://richmenu.app.e-chan.me/）を使用。

・リッチメニュー一覧
curl -v -X GET https://api.line.me/v2/bot/richmenu/list -H "Authorization: Bearer {}"

・リッチメニューエイリアス一覧
curl -v -X GET https://api.line.me/v2/bot/richmenu/alias/list -H "Authorization: Bearer {token}"