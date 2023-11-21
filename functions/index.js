// Firebase関連設定
require("firebase-functions/logger/compat");
process.env.TZ = "Asia/Tokyo";

const {initializeApp} = require("firebase-admin/app");
const { getFirestore } = require('firebase-admin/firestore');
const functions = require("firebase-functions");

initializeApp();

let linebot_account;
if (process.env.K_REVISION == 1){
  console.log("ローカル環境で起動中…");
  console.log("ローカルデバック用LINEアカウント情報を読み込みます。");
  console.log("webhook接続先は「[ngrokURL]/racsu-develop/asia-northeast1/node_functions/webhook」です。")
  linebot_account = require("./data/keys/LineAccount_local.json");

} else{
  linebot_account = require("./data/keys/LineAccount.json");
}
// const linebot_account = require("./data/keys/LineAccount.json");
const linebot_sdk = require("@line/bot-sdk");
const Line_Sender = require("./file_modules/line_sender");
const linebot_client = new linebot_sdk.Client(linebot_account);


// ExpressApp作成
const express = require("express");
const app = express();

// データベースインスタンス作成
const db = getFirestore();


// ----------------------------------------------
// 連携済み全ユーザーデータ取得関数
// ----------------------------------------------
const get_all_data = async({get_class_name_dic=false}) => {
  const all_user_data = {}, all_reg_tasks = {};
  (await db.collection("users").get()).forEach(doc => {
    const data = doc.data();
    if (data.account_status == "linked"){
      all_user_data[doc.id] = data;
    }
  });
  (await db.collection("tasks").get()).forEach(doc => {
    if (doc.id in all_user_data){
      all_reg_tasks[doc.id] = doc.data();;
    }
  });
  const all_user_id = Object.keys(all_user_data);
  if (get_class_name_dic){
    const class_name_dic = (await db.collection("overall").doc("classes").get()).data();
    return {all_user_data: all_user_data, all_reg_tasks:all_reg_tasks, all_user_id:all_user_id, class_name_dic:class_name_dic};
  } else {
    return {all_user_data: all_user_data, all_reg_tasks:all_reg_tasks, all_user_id:all_user_id};
  }
}

// ----------------------------------------------
// エンドポイント内部処理設定
// ----------------------------------------------
app.use("/webhook", linebot_sdk.middleware(linebot_account));
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
  return null;
});

app.get("/test_point", async(req, res) => {
  console.log("Test point OK.")
  // -------------------------------

  const autoapp_update = require("./apps/autoapp_update");
  autoapp_update(db, await get_all_data({ get_class_name_dic : true }))
  .catch((e) => {
    console.log("自動更新でエラー発生", e);
  });

  // -------------------------------
  res.status(200).json({}).end();
  return null;
})


// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
exports.node_functions = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 10,
  memory: "2GB",
  secrets: ["MAIL_PASS"]
})
.https
.onRequest(app);


// ----------------------------------------------
// 定期実行関数設定：課題アップデート
// ----------------------------------------------
exports.trigger_update = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 1,
  memory: "1GB"
})
.pubsub.schedule('every day 8:30')
// .pubsub.schedule('every day 16:16')
.timeZone('Asia/Tokyo')
.onRun(async(context) => {
  const autoapp_update = require("./apps/autoapp_update");
  autoapp_update(db, await get_all_data({ get_class_name_dic : true }))
  .catch((e) => {
    console.log("自動更新でエラー発生", e);
  });
  return null;
});


// ----------------------------------------------
// 定期実行関数設定：課題通知
// ----------------------------------------------
exports.trigger_notify = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 1,
  memory: "1GB",
  secrets: ["MAIL_PASS"],
  timeoutSeconds: 540
})
.pubsub.schedule('every day 9:00')
// .pubsub.schedule('every day 16:25')
.timeZone('Asia/Tokyo')
.onRun(async(context) => {
  const autoapp_notify = require("./apps/autoapp_notify");
  autoapp_notify(await get_all_data({ get_class_name_dic : false }))
  .catch((e) => {
    console.log("自動通知でエラー発生", e);
  });

  return null;
});