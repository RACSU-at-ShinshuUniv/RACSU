// Firebase関連設定
require("firebase-functions/logger/compat");
process.env.TZ = "Asia/Tokyo";

const {initializeApp} = require("firebase-admin/app");
const { getFirestore } = require('firebase-admin/firestore');
const firebase_functions = require("firebase-functions");

initializeApp();

// LINE_bot_SDKインスタンス作成
const linebot_sdk = require("@line/bot-sdk");
const linebot_account = require("./keys/LineAccount.json");
const linebot_client = new linebot_sdk.Client(linebot_account);
const Line_Sender = require("./file_modules/line_sender");

// ExpressApp作成
const express = require("express");
const app = express();

// データベースインスタンス作成
const db = getFirestore();

// ----------------------------------------------
// メッセージハンドラ
// ----------------------------------------------

const ms_handler = async(event_data, line_sender) => {
  switch (event_data.type){

    // フォローアクション
    case "follow": {
      const app_add_user = require("./apps/app_add_user");
      app_add_user(db, {
        user_id: event_data.source.userId,
        user_name: await line_sender.get_name({id: event_data.source.userId})

      }).then(() => {
        line_sender.flex_added_friend();

      }).catch((e) => {
        line_sender.alert_error({
          error_msg: e
        });
      });
      break;
    }

    // ブロックアクション
    case "unfollow": {
      const app_delete_user = require("./apps/app_delete_user");
      app_delete_user(db, {
        user_id: event_data.source.userId
      });
      break;
    }

    // ポストバックアクション
    case "postback": {
      break
    }

    // メッセージアクション
    case "message": {
      if (event_data.message.type !== "text"){
        line_sender.text({
          message: `${event_data.message.type}タイプのメッセージは\n受け取ることができません<(_ _)>`
        });
        break;

      } else {
        console.time("ユーザーデータ取得所要時間");
        const account_data = (await db.collection("users").doc(event_data.source.userId).get()).data();
        console.timeEnd("ユーザーデータ取得所要時間");

        switch(account_data.account_status){

          // 学籍番号の受信処理と認証メールの送信
          case "wait_student_id": {
            const app_add_student_id = require("./apps/app_add_student_id");
            app_add_student_id(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text

            }).then((res) => {
              if (res.result == "ok"){
                line_sender.flex_auth_guide({
                  address: res.data
                });

              } else {
                line_sender.text({
                  message: "学籍番号を認識できませんでした。\nもう一度送信してください。"
                });
              }

            }).catch((e) => {
              line_sender.alert_error({
                error_msg: e
              });
            });

            break;
          }


          // 認証トークンの確認と利用規約の送信
          case "confirm_token": {
            const app_confirm_token = require("./apps/app_confirm_token");
            app_confirm_token(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text,
              token: account_data.temporary_data

            }).then((res) => {
              if (res.result == "retry"){
                line_sender.flex_added_friend();
              } else if (res.result == "ok"){
                line_sender.flex_user_policy();
              } else {
                line_sender.text({
                  message: "認証に失敗しました。\nもう一度メールをご確認の上、アルファベットを含めた認証コードを送信してください。\nメール未受信の場合、「初めからやり直す」と送信してください。"
                });
              }

            }).catch((e) => {
              line_sender.alert_error({
                error_msg: e
              });
            });

            break;
          }


          // 規約の同意確認と連携ガイドの送信
          case "authenticated": {
            const app_confirm_agreement = require("./apps/app_confirm_agreement");
            app_confirm_agreement(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text

            }).then((res) => {
              if (res.result == "ok"){
                line_sender.flex_link_guide({
                  student_id: account_data.student_id
                })
              } else {
                line_sender.text({
                  message: "利用を開始するには、規約に同意をお願いします。"
                });
              }

            }).catch((e) => {
              line_sender.alert_error({
                error_msg: e
              });
            });

            break;
          }


          // eAlps連携処理
          case "linking": {
            const app_confirm_cal_url = require("./apps/app_confirm_cal_url");
            app_confirm_cal_url(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text,
              account_data: account_data

            }).then((res) => {
              if (res.result == "continue"){
                line_sender.text({
                  message: "1つ目のURLを登録しました。\n続いて、もう一つのURLも登録してください。"
                });

              } else if (res.result == "ok"){
                line_sender.text({
                  message: "初期設定が完了しました！"
                });

              } else {
                line_sender.text({
                  message: res.msg
                });
              }

            }).catch((e) => {
              line_sender.alert_error({
                error_msg: e
              });
            });

            break;
          }


          // 初期設定完了後のメッセージハンドラ
          case "linked": {
            const message = event_data.message.text;

            // 課題リストの送信
            if (message == "登録済みの課題を表示"){
              const app_get_task_flex = require("./apps/app_get_task_flex");
              app_get_task_flex(db, {
                user_id: event_data.source.userId

              }).then((res) => {
                if (res.result == "ok"){
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text
                  })
                }

              }).catch((e) => {
                line_sender.alert_error({
                  error_msg: e
                });
              });


            // 課題の更新
            } else if (message == "データを更新する"){
              const rich_menu_id = require("./env_variables/rich_menu_id.json");
              line_sender.link_rich_menu({
                user_id: event_data.source.userId,
                rich_menu_id: rich_menu_id.list_menu_overlay
              });
              const app_update_task = require("./apps/app_update_task");
              app_update_task(db, {
                user_id: event_data.source.userId,
                account_data: account_data

              }).then((res) => {
                if (res.result == "ok"){
                  line_sender.link_rich_menu({
                    user_id: event_data.source.userId,
                    rich_menu_id: rich_menu_id.list_menu
                  });
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text,
                    notice_refresh: true,
                    notice_message: "課題を最新に更新しました。"
                  });

                } else if (res.result == "no task"){
                  line_sender.text({
                    message: "新規取得できる課題がありません。"
                  })
                }

              }).catch((e) => {
                line_sender.alert_error({
                  error_msg: e
                });
              });

             // その他のコマンド処理
            } else if (message.includes("cmd@")){
              const app_confirm_command = require("./apps/app_confirm_command");
              app_confirm_command(db, {
                user_id: event_data.source.userId,
                message: message

              }).then((res) => {
                if (res.result == "ok" && res.res_type == "task_list"){
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text
                  });

                } else if (res.result == "ok" && res.res_type == "task_list_added"){
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text,
                    notice_refresh: true,
                    notice_message: "指定の課題を追加しました。"
                  });
                }

              }).catch((e) => {
                line_sender.alert_error({
                  error_msg: e
                });
              });

            } else if (message.includes("【☆課題追加フォーム☆】")){
              // 課題手動追加処理
              const app_add_manual_task = require("./apps/app_add_manual_task");
              app_add_manual_task(db, {
                user_id: event_data.source.userId,
                message: message

              }).then((res) => {
                if (res.result == "ok"){
                  line_sender.flex_add_task({
                    content: message,
                    task_data: res.data
                  })

                } else {
                  line_sender.flex_retry_add_task({
                    err_msg: res.msg,
                    content: message
                  })
                }

              }).catch((e) => {
                line_sender.alert_error({
                  error_msg: e
                });
              });

            } else {}
            break;
          }
        }
      }

      break;
    }

    // 未想定のアクション
    default: {
      line_sender.text({
        message: "このアクションはサポートされていません。"
      });
      break;
    }
  }

  return Promise.resolve("done");
}



// ----------------------------------------------
// エンドポイント公開設定
// ----------------------------------------------
app.post('/webhook', linebot_sdk.middleware(linebot_account), (req, res) => {
  console.log("<<<<<<<-----------------------処理開始----------------------->>>>>>>")
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
  console.log(">>>>>>>-----------------------処理終了-----------------------<<<<<<<");
});


exports.line_end_point = firebase_functions
  .region('asia-northeast1')
  .runWith({
    maxInstances: 3,
    memory: "1GB",
  }).https.onRequest(app);


exports.auto_notify = firebase_functions
  .region('asia-northeast1')
  .runWith({
    maxInstances: 2,
    memory: "1GB",
  })
  .pubsub.schedule('every day 09:00')
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