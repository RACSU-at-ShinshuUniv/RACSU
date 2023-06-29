// Firebase関連設定
require("firebase-functions/logger/compat");
const {initializeApp, cert} = require("firebase-admin/app");
const firebase_functions = require("firebase-functions");
const serviceAccount = require("./keys/ServiceAccount.json");
initializeApp({credential: cert(serviceAccount)});
// firebase_initializeApp(); // 本番デプロイ時は上を無効化してこっち

// LINEbotSDK
const linebot_sdk = require("@line/bot-sdk");
const linebot_account = require("./keys/LineAccount.json");
const linebot_client = new linebot_sdk.Client(linebot_account);

// Express
const express = require("express");
const app = express();

// メッセージハンドラ
const message_handler = require("./file_modules/message_handler")

// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
app.post('/webhook', linebot_sdk.middleware(linebot_account), (req, res) => {
  message_handler.set_client({
    client: linebot_client,
    reply_token: req.body.events[0].replyToken

  }).then(() => {
    message_handler.handle({
      event_data: req.body.events[0]
    })

  }).then(() => {
    res.status(200).json({}).end();

  }).catch((error) => {
    message_handler.error({
      err: error
    })
    console.error(error);
    res.status(200).json({}).end();
  })
});

exports.line_end_point = firebase_functions.runWith({
  maxInstances: 1,
  timeoutSeconds: 30,
  memory: "128MB",
}).https.onRequest(app);