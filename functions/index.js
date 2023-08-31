// Firebase関連設定
require("firebase-functions/logger/compat");
process.env.TZ = "Asia/Tokyo";

const {initializeApp, cert} = require("firebase-admin/app");
const { getFirestore } = require('firebase-admin/firestore');
const firebase_functions = require("firebase-functions");

const serviceAccount = require("./keys/ServiceAccount.json");
initializeApp({credential: cert(serviceAccount)});
// initializeApp(); // 本番デプロイ時は上を無効化してこっち

// LINE_bot_SDKインスタンス作成
const linebot_sdk = require("@line/bot-sdk");
const linebot_account = require("./keys/LineAccount.json");
const linebot_client = new linebot_sdk.Client(linebot_account);
const Line_Sender = require("./file_modules/line_sender");

// ExpressApp作成
const express = require("express");
const app = express();


// ----------------------------------------------
// メッセージハンドラ
// ----------------------------------------------

const ms_handler = async(event_data, line_sender) => {
  const db = getFirestore();
  switch (event_data.type){

    // フォローアクション
    case "follow": {
      const app_register_user = require("./apps/app_register_user");
      app_register_user(db, {
        user_id: event_data.source.userId,
        user_name: await line_sender.get_name({id: event_data.source.userId})
      });
      line_sender.flex_added_friend();
      return;
    }

    // ブロックアクション
    case "unfollow": {
      const app_delete_user = require("./apps/app_delete_user");
      app_delete_user(db, {
        user_id: event_data.source.userId
      });
      return;
    }

    // ポストバックアクション
    case "postback": {
      return
    }

    // メッセージアクション
    case "message": {
      if (event_data.message.type !== "text"){
        line_sender.text({
          message: `${event_data.message.type}タイプのメッセージは\n受け取ることができません<(_ _)>`
        });

      } else {
        console.time("ユーザーデータ取得所要時間");
        const account_data = (await db.collection("users").doc(event_data.source.userId).get()).data();
        console.timeEnd("ユーザーデータ取得所要時間");

        switch(account_data.account_status){
          case "wait_student_id": {
            const app_register_id = require("./apps/app_register_id");
            app_register_id(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text

            }).then((address) => {
              line_sender.flex_auth_guide({
                address: address
              });

            }).catch(() => {
              line_sender.text({
                message: "学籍番号を認識できませんでした。\nもう一度送信してください。"
              });
            });

            return;
          }

          case "confirm_token": {
            const app_confirm_token = require("./apps/app_confirm_token");
            app_confirm_token(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text,
              token: account_data.temporary_data

            }).then((res) => {
              if (res == "retry"){
                line_sender.flex_added_friend();
              } else if (res == "authenticated"){
                line_sender.flex_user_policy();
              }

            }).catch(() => {
              line_sender.text({
                message: "認証に失敗しました。\nもう一度メールをご確認の上、アルファベットを含めた認証コードを送信してください。\nメール未受信の場合、「初めからやり直す」と送信してください。"
              });
            })

            return;
          }

          case "authenticated": {
            const app_confirm_agreement = require("./apps/app_confirm_agreement");
            app_confirm_agreement(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text

            }).then(() => {
              line_sender.flex_link_guide({
                student_id: account_data.student_id
              })

            }).catch(() => {
              line_sender.text({
                message: "利用を開始するには、規約に同意をお願いします。"
              });
            })

            return;
          }

          case "linking": {
            const app_confirm_cal_url = require("./apps/app_confirm_cal_url");
            app_confirm_cal_url(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text,
              account_data: account_data

            }).then((res) => {
              if (res == "continue"){
                line_sender.text({
                  message: "1つ目のURLを登録しました。\n続いて、もう一つのURLも登録してください。"
                });

              } else if (res == "complete"){
                line_sender.text({
                  message: "初期設定が完了しました！"
                });
              }

            }).catch((e) => {
              line_sender.text({
                message: e
              });
            })

            return;
          }

          case "linked": {
            switch (event_data.message.text){
              case "登録済みの課題を表示": {
                const app_get_task_flex = require("./apps/app_get_task_flex");
                app_get_task_flex(db, {
                  user_id: event_data.source.userId

                }).then((res) => {
                  line_sender.flex_task_list({
                    contents: res.contents,
                    alt_text: res.alt_text
                  })

                }).catch((e) => {
                  return Promise.reject(e)
                })

                return;
              }

              case "データを更新する":{
                const app_update_task = require("./apps/app_update_task");
                app_update_task(db, {
                  user_id: event_data.source.userId,
                  account_data: account_data

                }).then((res) => {
                  line_sender.flex_task_list({
                    contents: res.contents,
                    alt_text: res.alt_text,
                    notice_refresh: true
                  });

                }).catch(() => {
                  line_sender.text({
                    message: "新規取得できる課題が1件もありません。"
                  })
                })

                return;
              }
            }

            return;
          }
        }
      }

      return;
    }

    // 未想定のアクション
    default: {
      line_sender.text({
        message: "このアクションはサポートされていません。"
      });
    }
  }

  console.log("メッセージハンドリング | 処理完了");
  return Promise.resolve("done");
}



// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
app.post('/webhook', linebot_sdk.middleware(linebot_account), (req, res) => {
  console.log("----------------------------処理開始------------------------------")
  const line_sender = new Line_Sender({
    client: linebot_client,
    reply_token: req.body.events[0].replyToken
  });

  console.time("レスポンス処理所要時間");
  ms_handler(req.body.events[0], line_sender
  ).then(() => {
    res.status(200).json({}).end();

  }).catch((e) => {
    line_sender.alert_error({
      error_msg: e
    })
    res.status(200).json({}).end();
  })
  console.timeEnd("レスポンス処理所要時間");
});


exports.line_end_point = firebase_functions
.region('asia-northeast1')
.runWith({
  maxInstances: 3,
  memory: "1GB",
}).https.onRequest(app);