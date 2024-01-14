// Firebase関連設定
require("firebase-functions/logger/compat");
process.env.TZ = "Asia/Tokyo";

const {initializeApp} = require("firebase-admin/app");
const { getFirestore } = require('firebase-admin/firestore');
const functions = require("firebase-functions");

initializeApp();

let lineAccount;
if (process.env.K_REVISION == 1){
  console.log("ローカル環境で起動中…");
  console.log("ローカルデバック用LINEアカウント情報を読み込みます。");
  console.log("webhook接続先は「[ngrokURL]/racsu-develop/asia-northeast1/expressFunctions/webhook」です。")
  lineAccount = require("./data/keys/LineAccount_local.json");

} else {
  lineAccount = require("./data/keys/LineAccount.json");
}

const { LineBotMiddleware } = require("./lib/LineBotController")

// ExpressApp作成
const express = require("express");
const app = express();

// データベースインスタンス作成
const db = getFirestore();

// メッセージ処理スクリプト
const messageHandler = require("./messageHandler");


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
  try{
    console.log(`webhook処理開始 from: [${req.body.events[0].source.userId}] msg: [${(req.body.events[0].message.text).replace(/\n/g, "")}]`);
  } catch(e) {
    if (req.body.events[0] !== undefined){
      console.log(`webhook処理開始 from: [${req.body.events[0].source.userId}] type: [${req.body.events[0].type}]`);
    } else {
      res.status(200).json({}).end();
      return null;
    }
  }

  messageHandler(db, req.body.events[0], lineAccount);

  res.status(200).json({}).end();
  return null;
});

app.get("/test_point", async(req, res) => {
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