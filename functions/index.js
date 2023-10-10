// Firebase関連設定
require("firebase-functions/logger/compat");
process.env.TZ = "Asia/Tokyo";

const {initializeApp} = require("firebase-admin/app");
const { getFirestore } = require('firebase-admin/firestore');
const functions = require("firebase-functions");

initializeApp();

const linebot_sdk = require("@line/bot-sdk");
const Line_Sender = require("./file_modules/line_sender");
const linebot_account = require("./data/keys/LineAccount.json");
const linebot_client = new linebot_sdk.Client(linebot_account);


// ExpressApp作成
const express = require("express");
const app = express();

// データベースインスタンス作成
const db = getFirestore();

// pushブロックのテスト

// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
app.use("/webhook", linebot_sdk.middleware(linebot_account));
app.post("/webhook", (req, res) => {
  console.log("<<<<<<<-----------------------処理開始----------------------->>>>>>>");
  console.time("レスポンス処理所要時間");

  const line_sender = new Line_Sender({
    client: linebot_client,
    reply_token: req.body.events[0].replyToken
  });

  const ms_handler = require("./apps/ms_handler");
  ms_handler(db, req.body.events[0], line_sender
  ).then(() => {
    res.status(200).json({}).end();

  }).catch((e) => {
    line_sender.alert_error({
      error_msg: e
    })
    res.status(200).json({}).end();
  })

  console.timeEnd("レスポンス処理所要時間");
  console.log(">>>>>>>-----------------------処理終了-----------------------<<<<<<<");
});


exports.line_end_point = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 3,
  memory: "1GB",
  secrets: ["R_LIST_MENU", "R_LIST_MENU_OVERLAY", "MAIL_PASS"]
})
.https
.onRequest(app);

exports.auto_notify = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 2,
  memory: "1GB",
  timeoutSeconds: 300,
  secrets: ["MAIL_PASS"]
})
.pubsub.schedule('every day 9:00')
.timeZone('Asia/Tokyo')
.onRun(async(context) => {
  const app_auto_notify = require("./apps/app_auto_notify");
  const data = await db.collection("users").get();

  data.forEach(doc => {
    const user_id = doc.id;
    const user_address = `${doc.data().student_id}@shinshu-u.ac.jp`

    app_auto_notify(db, {
      user_id: user_id,
      user_address: user_address
    }).then((res) => {
      console.log(`${user_address} -> ${res.result}, ${res.status}`);
    }).catch((e) => {
      console.log(`error at ${user_address}\n${e}`)
    });
  });

  return null;
});