"use strict";

require("firebase-functions/logger/compat");
const express = require("express");
const {initializeApp, cert} = require("firebase-admin/app");
const firebase_functions = require("firebase-functions");
const firebase_firestore = require("firebase-admin/firestore");
const linebot_sdk = require("@line/bot-sdk");
const linebot_account = require("./keys/LineAccount.json");

// --- 初期化処理 ---------------------------------------------
// firebaseクライアント
const serviceAccount = require("./keys/ServiceAccount.json");
initializeApp({credential: cert(serviceAccount)});
// firebase_initializeApp(); // 本番デプロイ時は上を無効化してこっち

// LINE返信クライアント
const linebot_client = new linebot_sdk.Client(linebot_account);

// LINEエンドポイント用Expressフレームワーク
const app = express();

// -----------------------------------------------------------


app.post('/webhook', (req, res) => {
  linebot_sdk.middleware(linebot_account);

  Promise
    .all(req.body.events.map(message_parrot_returner))
    .then(() => res.status(200).end())
    .catch((error) => console.log(`error: ${error}`));
});

// エンドポイントを公開
exports.line_end_point = firebase_functions.runWith({
  maxInstances: 1,
  timeoutSeconds: 30,
  memory: "128MB",
}).https.onRequest(app);


// オウム返し
const message_parrot_returner = async(event) => {
  if (event.type == 'message' && event.message.type !== 'text') {
    return Promise.resolve(event.message.type);
  }

  linebot_client.replyMessage(event.replyToken, {
    type: 'text',
    text: `${event.message.text}を受け取りました。`
  });
}