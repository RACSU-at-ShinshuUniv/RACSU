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

app.get("/dev/send/:method/:to", async(req, res) => {
  const mail_sender = require("./file_modules/mail_sender");
  const data = await db.collection("users").get();

  if (req.params.method == "test"){
    if (req.params.to == "all"){
      data.forEach(doc => {
        const user_address = `${doc.data().student_id}@shinshu-u.ac.jp`
        mail_sender({
          method: "test",
          address: user_address,
          data: {}
        }).then((r) => {
          console.log(`${user_address} -> ${r.result}, ${r.status}`);
        }).catch((e) => {
          console.log(`error at ${user_address}\n${e}`)
        });
      })
    } else {
      mail_sender({
        method: "test",
        address: req.params.to,
        data: {}
      }).then((r) => {
        console.log(`${req.params.to} -> ${r.result}, ${r.status}`);
      }).catch((e) => {
        console.log(`error at ${user_address}\n${e}`)
      });
    }

  } else if (req.params.method == "notify" && req.params.to == "all"){
    const app_auto_notify = require("./apps/app_auto_notify");

    app_auto_notify(db)
    .then((res) => {
      console.log("finish", res.status);

    }).catch((e) => {
      console.log(e)
    });
  }

  res.status(200).send("ok");
})

app.get("/dev/update/:id", async(req, res) => {
  const data = await db.collection("users").get();
  const app_update_task = require("./apps/app_update_task");
  let done = false;

  data.forEach(doc => {
    const user_id = doc.id;
    if (req.params.id == user_id || req.params.id == "all"){
      done = true;
      const user_data = doc.data();
      app_update_task(db, {
        user_id: user_id,
        account_data: user_data
      }).then((r) => {
        console.log(user_id, r);
      }).catch((e) => {
        console.log(user_id, e);
      });
    }
  });

  if (done){
    res.status(200).send("ok");
  } else {
    res.status(202).send("ok");
  }
})



exports.line_end_point = functions
.region('asia-northeast1')
.runWith({
  maxInstances: 3,
  memory: "1GB",
  secrets: ["R_LIST_MENU", "R_LIST_MENU_OVERLAY", "MAIL_PASS"]
})
.https
.onRequest(app);

// exports.auto_notify = functions
// .region('asia-northeast1')
// .runWith({
//   maxInstances: 2,
//   memory: "1GB",
//   timeoutSeconds: 300,
//   secrets: ["MAIL_PASS"]
// })
// .pubsub.schedule('every day 9:00')
// .timeZone('Asia/Tokyo')
// .onRun(async(context) => {
//   const app_auto_notify = require("./apps/app_auto_notify");
//   const data = await db.collection("users").get();

//   data.forEach(doc => {
//     const user_id = doc.id;
//     const user_address = `${doc.data().student_id}@shinshu-u.ac.jp`

//     app_auto_notify(db, {
//       user_id: user_id,
//       user_address: user_address
//     }).then((res) => {
//       console.log(`${user_address} -> ${res.result}, ${res.status}`);
//     }).catch((e) => {
//       console.log(`error at ${user_address}\n${e}`)
//     });
//   });

//   return null;
// });