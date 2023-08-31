// Firebase関連設定
require("firebase-functions/logger/compat");

const {initializeApp, cert} = require("firebase-admin/app");
const functions = require("firebase-functions");
const serviceAccount = require("./keys/ServiceAccount.json");
initializeApp({credential: cert(serviceAccount)});
// initializeApp(); // 本番デプロイ時は上を無効化してこっち

// LINE_bot_SDKインスタンス作成
const linebot_sdk = require("@line/bot-sdk");
const linebot_account = require("./keys/LineAccount.json");
const linebot_client = new linebot_sdk.Client(linebot_account);

// ExpressApp作成
const express = require("express");
const app = express();


// タイムゾーン設定
process.env.TZ = "Asia/Tokyo";

// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
app.post('/webhook', linebot_sdk.middleware(linebot_account), async(req, res) => {

  linebot_client.replyMessage(req.body.events[0].replyToken, {
    type: "text",
    text: "あああ"
  });

  res.status(200).json({}).end();
});

exports.line_end_point = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 1,
  memory: "1GB",
}).https.onRequest(app);