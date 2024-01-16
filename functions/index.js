require("firebase-functions/logger/compat");
process.env.TZ = "Asia/Tokyo";

const { initializeApp } = require("firebase-admin/app");
initializeApp();

// Firebase機能
const { Firestore } = require('@google-cloud/firestore');
const functions = require("firebase-functions");

// LINEアカウントデータ
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
const { LineBotMiddleware } = require("./lib/LineBotController")

// ExpressApp作成
const express = require("express");
const app = express();

// データベースインスタンス作成
const db = new Firestore();


// ----------------------------------------------
// 連携済み全ユーザーデータ取得関数
// ----------------------------------------------
const getAutoRunTargetUser = async() => {
  const linkedUserData = {}, notifyUserIds=[];
  (await db.collection("users").get()).forEach(doc => {
    const data = doc.data();
    if (data.accountStatus == "linked"){
      linkedUserData[doc.id] = data;
      if (data.notify){
        notifyUserIds.push(doc.id);
      }
    }
  });
  (await db.collection("tasks").get()).forEach(doc => {
    if (doc.id in linkedUserData){
      linkedUserData[doc.id]["registeredTask"] = doc.data();;
    }
  });
  return {linkedUserData: linkedUserData, notifyUserIds: notifyUserIds};
}

// ----------------------------------------------
// エンドポイント内部処理設定
// ----------------------------------------------
app.use("/webhook", LineBotMiddleware(lineAccount));
app.post("/webhook", (req, res) => {
  if (req.body.events[0]?.source == undefined){
    console.log("Connection checked.");
    res.status(200).json({}).end();
    return null;
  }

  console.log(`Access from ${req.body.events[0]?.source?.userId}. actionType=${(req.body.events[0]?.type)}${req.body.events[0]?.message?.text !== undefined ? `, message=「${(req.body.events[0]?.message?.text).replace(/\n/g, "")}」` : ""}`);

  if (!process.env.INITIALIZED){
    process.env.INITIALIZED = true;
    console.log("Init")
    db.collection("users").doc(req.body.events[0].source.userId).get();
  }

  (async() => {
    console.time(`Status check of ${req.body.events[0].source.userId}`);
    const userDoc = await db.collection("users").doc(req.body.events[0].source.userId).get();
    console.timeEnd(`Status check of ${req.body.events[0].source.userId}`);
    const messageHandler = require("./messageHandler");
    messageHandler(db, req.body.events[0], (userDoc.exists ? userDoc.data() : {}), lineAccount);
  })();
  res.status(200).json({}).end();

  return null;
});

app.get("/testPoint", async(req, res) => {
  console.log("Test point OK.")
  // -------------------------------

  // -------------------------------
  res.status(200).json({}).end();
  return null;
})


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


// ----------------------------------------------
// 定期実行関数設定：課題アップデート
// ----------------------------------------------
exports.triggerUpdate = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 1,
  memory: "1GB"
})
.pubsub.schedule('every day 8:30')
.timeZone('Asia/Tokyo')
.onRun(async(context) => {
  const autoTaskUpdate = require("./auto/autoTaskUpdate");
  autoTaskUpdate(db, await getAutoRunTargetUser())
  .catch((e) => {
    console.log("自動更新でエラー発生", e);
  });
  return null;
});


// ----------------------------------------------
// 定期実行関数設定：課題通知
// ----------------------------------------------
exports.triggerNotify = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 1,
  memory: "1GB",
  timeoutSeconds: 540
})
.pubsub.schedule('every day 9:00')
.timeZone('Asia/Tokyo')
.onRun(async(context) => {
  const autoTaskNotify = require("./auto/autoTaskNotify");
  autoTaskNotify(await getAutoRunTargetUser())
  .catch((e) => {
    console.log("自動通知でエラー発生", e);
  });

  return null;
});