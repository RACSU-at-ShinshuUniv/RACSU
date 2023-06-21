require("firebase-functions/logger/compat");
const express = require("express");
const linebot_sdk = require("@line/bot-sdk");
const {initializeApp, cert} = require("firebase-admin/app");
const firebase_functions = require("firebase-functions");

const line_sender = require("./file_modules/line_message_sender");
const firestore_read = require("./file_modules/firestore_read");
const firebase_write = require("./file_modules/firestore_write");

// ----------------------------------------------
// 初期化処理
// ----------------------------------------------
// firebaseクライアント
const serviceAccount = require("./keys/ServiceAccount.json");
initializeApp({credential: cert(serviceAccount)});
// firebase_initializeApp(); // 本番デプロイ時は上を無効化してこっち

// LINEクライアント
const linebot_account = require("./keys/LineAccount.json");
const linebot_client = new linebot_sdk.Client(linebot_account);

// LINEエンドポイント用Expressフレームワーク
const app = express();


// ----------------------------------------------
// ユーザーメッセージ処理
// ----------------------------------------------
const message_handler = async(event_data) => {
  // テキストメッセージ以外を除外
  console.log("type1:", event_data.type, "type2", event_data.message.type);
  if (event_data.type == "message" && event_data.message.type !== "text"){
    line_sender.alert_only_text({
      client: linebot_client,
      reply_token: event_data.replyToken
    })
    return Promise.resolve("done");
  }

  line_sender.text_parrot_returner({
    client: linebot_client,
    reply_token: event_data.replyToken,
    message: event_data.message.text
  })

  return Promise.resolve("done");
}


// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
app.post('/webhook', linebot_sdk.middleware(linebot_account), (req, res) => {
  // console.log(req.body.events);
  Promise.all(req.body.events.map(message_handler))
  .then(() => {
    res.status(200).end();
  })
  .catch((error) => {
    console.error(error);
    res.status(200).end();
  })
});

exports.line_end_point = firebase_functions.runWith({
  maxInstances: 1,
  timeoutSeconds: 30,
  memory: "128MB",
}).https.onRequest(app);