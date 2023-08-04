// Firebase関連設定
require("firebase-functions/logger/compat");

const {initializeApp, cert} = require("firebase-admin/app");
const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
// const serviceAccount = require("./keys/ServiceAccount.json");
// initializeApp({credential: cert(serviceAccount)});
initializeApp(); // 本番デプロイ時は上を無効化してこっち

// LINE_bot_SDKインスタンス作成
const linebot_sdk = require("@line/bot-sdk");
const linebot_account = require("./keys/LineAccount.json");
const linebot_client = new linebot_sdk.Client(linebot_account);

// ExpressApp作成
const express = require("express");
const app = express();

// dev
const db = getFirestore();
// /dev


// タイムゾーン設定
process.env.TZ = "Asia/Tokyo";

n = 0;

// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
app.post('/webhook', linebot_sdk.middleware(linebot_account), async(req, res) => {
  n += 1;
  console.log(`@@@function start | count: ${n}times`);

  console.time("firestore_init")
  const doc_data = await db.collection("flex").doc("U5a2991011c7a349ab5c5bebc4347cfb6").get();
  console.timeEnd("firestore_init")


  linebot_client.replyMessage(req.body.events[0].replyToken, {
    type: "flex",
    altText: doc_data.data().alt_text,
    contents: {
      "type": "bubble",
      "size": "giga",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": doc_data.data().contents
      }
    }
  });

  res.status(200).json({}).end();
});

exports.line_end_point = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 1,
  memory: "1GB",
}).https.onRequest(app);