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
const admin_app = express();

// データベースインスタンス作成
const db = getFirestore();

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

admin_app.get("/:id/task_update/:method", async(req, res) => {
  const admin_ids = (await db.collection("overall").doc("admin").get()).data().id;
  if (admin_ids.includes(req.params.id)){
    if (req.params.method == "all"){
      const app_auto_task_update = require("./apps/app_auto_task_update");
      app_auto_task_update(db)
      .then((r) => {
        console.log("finish", r)
      }).catch((e) => {
        console.log(e);
      });
      res.status(200).send("start app_auto_task_update");

    } else {
      res.status(200).send(`Error: invalid method of ${req.params.method}`);
    }
  } else {
    res.status(200).send(`Error: invalid id of ${req.params.id}`);
  }
});

admin_app.get("/:id/task_notify/:method", async(req, res) => {
  const admin_ids = (await db.collection("overall").doc("admin").get()).data().id;
  if (admin_ids.includes(req.params.id)){
    if (req.params.method == "all"){
      const app_auto_notify = require("./apps/app_auto_notify");
      app_auto_notify(db)
      .then((r) => {
        console.log("finish", r)
      }).catch((e) => {
        console.log(e);
      });
      res.status(200).send("start app_auto_notify");

    } else {
      res.status(200).send(`Error: invalid method of ${req.params.method}`);
    }
  } else {
    res.status(200).send(`Error: invalid id of ${req.params.id}`);
  }
});



exports.line_end_point = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 10,
  memory: "1GB",
  secrets: ["R_LIST_MENU", "R_LIST_MENU_OVERLAY", "MAIL_PASS"]
})
.https
.onRequest(app);

exports.admin = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 10,
  memory: "",
  secrets: ["MAIL_PASS"]
})
.https
.onRequest(admin_app);

exports.auto_update = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 10,
  memory: "1GB",
  timeoutSeconds: 300
})
.pubsub.schedule('every day 8:30')
.timeZone('Asia/Tokyo')
.onRun(async(context) => {
  const app_auto_task_update = require("./apps/app_auto_task_update");
  app_auto_task_update(db)
  .then((res) => {
    console.log("finish", res)
  }).catch((e) => {
    console.log(e);
  });

  return null;
});

exports.auto_notify = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 10,
  memory: "1GB",
  timeoutSeconds: 300,
  secrets: ["MAIL_PASS"]
})
.pubsub.schedule('every day 9:00')
.timeZone('Asia/Tokyo')
.onRun(async(context) => {
  const app_auto_notify = require("./apps/app_auto_notify");
  app_auto_notify(db)
  .then((res) => {
    console.log("finish", res)
  }).catch((e) => {
    console.log(e);
  });

  return null;
});