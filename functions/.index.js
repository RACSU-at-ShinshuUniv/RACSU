// Firebase関連設定
require("firebase-functions/logger/compat");
process.env.TZ = "Asia/Tokyo";

const { initializeApp } = require("firebase-admin/app");
initializeApp();

// const { getFirestore } = require('firebase-admin/firestore');
const { Firestore } = require('@google-cloud/firestore');
const functions = require("firebase-functions");

const lineAccount = (() => {
  if (JSON.parse(process.env.FIREBASE_CONFIG).locationId == undefined){
    const lineAccount = require("./data/keys/LineAccount_local.json");
    return lineAccount;
  } else {
    const lineAccount = require("./data/keys/LineAccount.json");
    return lineAccount;
  }
})();

// LINEミドルウェア
const { LineBotMiddleware, LineBotController } = require("./lib/LineBotController")

// ExpressApp作成
const express = require("express");
const app = express();

// データベースインスタンス作成
// const db = getFirestore();


// ----------------------------------------------
// エンドポイント内部処理設定
// ----------------------------------------------
app.use("/webhook", LineBotMiddleware(lineAccount));
app.post("/webhook", (req, res) => {

  (async() => {
    const line = new LineBotController(lineAccount);
    // console.time("db")
    // const db = getFirestore();
    // console.timeEnd("db")

    // console.time("col")
    // const collection = db.collection("users")
    // console.timeEnd("col")

    // console.time("doc")
    // const doc = collection.doc(req.body.events[0].source.userId)
    // console.timeEnd("doc")

    // console.time("get")
    // const g = await doc.get()
    // console.timeEnd("get")

    const firestore = new Firestore();
    const doc = firestore.collection("users").doc(req.body.events[0].source.userId);

    console.time("get")
    const g = await doc.get()
    console.timeEnd("get")

    line.setReplyToken(req.body.events[0].replyToken).setText(`hello ${g.data().userName}`).send();
  })();

  res.status(200).json({}).end();
  return null;
});


// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
exports.expressFunctions = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 10,
  memory: "2GB"
})
.https
.onRequest(app);