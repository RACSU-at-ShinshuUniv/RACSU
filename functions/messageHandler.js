const { LineBotController } = require("./lib/LineBotController")
const getEnvRichMenuIdDict = () => {
  const envRichMenuIdDict = require("./data/richmenuIds.json");
  if (process.env.K_REVISION == 1) {
    return envRichMenuIdDict.local;

  } else if (process.env.GCLOUD_PROJECT == "racsu-develop") {
    return envRichMenuIdDict.dev;

  } else if (process.env.GCLOUD_PROJECT == "racsu-shindai") {
    return envRichMenuIdDict.prod;
  }
}

module.exports = (db, eventData, lineAccount) => {
  const line = new LineBotController(lineAccount);
  line.setReplyToken(eventData.replyToken);

  (async() => {
    switch (eventData.type) {

      // フォローアクション
      case "follow": {
        const addNewUser = require("./apps/addNewUser");
        addNewUser(db, {
          userId: eventData.source.userId,
          userName: await line.setUserId(eventData.source.userId).getUserName()

        }).then((res) => {
          line.setFlex(res.message.contents, res.message.altText).send();

        }).catch(e => {console.log(e);line.setError(e).send()});
        break;
      }

      // ブロックアクション
      case "unfollow": {
        const deleteUser = require("./apps/deleteUser");
        deleteUser(db, {
          userId: eventData.source.userId
        });
        break;
      }

      // ポストバックアクション
      case "postback": {
        switch (eventData.postback.data) {

          // チュートリアル終了時
          case "finish_tutorial": {
            const loadTask = require("./apps/loadTask");
            loadTask(db, {
              userId: eventData.source.userId

            }).then((res) => {
              line.setFlex(res.message.contents, res.message.altText)
              .setText("課題はこのような形で送信されます。\n課題をタップすることで、完了登録ができます。")
              .setText("※なにも課題が取得できなかった場合、空欄が送信されています。")
              .send();

            }).catch(e => {console.log(e);line.setError(e).send()});
            break;
          }

          // 課題手動追加開始時
          case "add_task": {
            const flexContents = require("./data/flexMessage/manualTaskLimitList.json");
            line.setFlex(flexContents, "提出期限を選択してください。").send();
            break;
          }

          default: {
            break;
          }
        }
        break;
      }

      // メッセージアクション
      case "message": {
        if (eventData.message.type !== "text") {
          break;
        }

        console.time("ユーザーデータ取得所要時間");
        const userData = (await db.collection("users").doc(eventData.source.userId).get()).data();
        console.timeEnd("ユーザーデータ取得所要時間");

        switch (userData.accountStatus) {

          // 学籍番号の受信処理と認証メールの送信
          case "wait_studentId": {
            const confirmStudentId = require("./apps/confirmStudentId");
            confirmStudentId(db, {
              userId: eventData.source.userId,
              message: eventData.message.text

            }).then((res) => {
              if (res.status == "done") {
                line.setFlex(res.message.contents, res.message.altText).send();

              } else {
                line.setText("はじめに学籍番号を送信してください。").send()
              }

            }).catch(e => {console.log(e);line.setError(e).send()});
            break;
          }


          // 認証トークンの確認と利用規約の送信
          case "confirm_token": {
            const confirmToken = require("./apps/confirmToken");
            confirmToken(db, {
              userId: eventData.source.userId,
              message: eventData.message.text,
              token: userData.tempData

            }).then((res) => {
              if (res.status == "done") {
                line.setFlex(res.message.contents, res.message.altText).send();

              } else {
                line.setText("認証に失敗しました。\nもう一度メールをご確認の上、アルファベットを含めた認証コードを送信してください。")
                .setText("メール未受信・学籍番号の入力間違いは、「初めからやり直す」と送信してください。")
                .send();
              }

            }).catch(e => {console.log(e);line.setError(e).send()});
            break;
          }


          // 規約の同意確認と連携ガイドの送信
          case "authenticated": {
            const confirmAgreement = require("./apps/confirmAgreement");
            confirmAgreement(db, {
              userId: eventData.source.userId,
              message: eventData.message.text,
              studentId: userData.studentId

            }).then((res) => {
              if (res.status == "done") {
                line.setFlex(res.message.contents, res.message.altText).send();

              } else {
                line.setText("利用を開始するには、規約に同意をお願いします。").send();
              }

            }).catch(e => {console.log(e);line.setError(e).send()});
            break;
          }


          // eAlps連携処理
          case "linking": {
            const confirmTaskUrl = require("./apps/confirmTaskUrl");
            confirmTaskUrl(db, {
              userId: eventData.source.userId,
              message: eventData.message.text,
              userData: userData

            }).then((res) => {
              if (res.status == "continue") {
                line.setText(res.message.contents).send();

              } else if (res.status == "done") {
                const envRichMenuIdDict = getEnvRichMenuIdDict();
                line.setFlex(res.message.contents, res.message.altText).send();
                line.setUserId(eventData.source.userId).linkRichMenu(envRichMenuIdDict["alias-tutorial-1"]);

              } else {
                line.setText(res.message.contents).send();
              }

            }).catch(e => {console.log(e);line.setError(e).send()});
            break;
          }


          // 初期設定完了後のメッセージハンドラ
          case "linked": {
            const message = eventData.message.text;

            // 課題リストの送信
            if (message == "登録済みの課題を表示" || message == "このまま送信して、今日の課題の詳細を表示＞＞＞") {
              const loadTask = require("./apps/loadTask");
              loadTask(db, {
                userId: eventData.source.userId

              }).then((res) => {
                line.setFlex(res.message.contents, res.message.altText).send();

              }).catch(e => {console.log(e);line.setError(e).send()});


            // 課題の更新
            } else if (message == "データを更新する") {
              const envRichMenuIdDict = getEnvRichMenuIdDict();
              line.setUserId(eventData.source.userId).linkRichMenu(envRichMenuIdDict["alias-list-menu-overlay"]);

              const updateTask = require("./apps/updateTask");
              updateTask(db, {
                userId: eventData.source.userId,
                userData: userData

              }).then((res) => {
                if (res.status == "done") {
                  line.linkRichMenu(envRichMenuIdDict["alias-list-menu"]);
                  line.setFlex(res.message.contents, res.message.altText)
                  .setText("課題を最新に更新しました。")
                  .send();

                } else {
                  line.setText(res.message.contents).send();
                }

              }).catch(e => {console.log(e);line.setError(e).send()});

            // その他のコマンド処理
            } else if (message.includes("cmd@")) {
              const confirmCommand = require("./apps/confirmCommand");
              confirmCommand(db, {
                userId: eventData.source.userId,
                message: message

              }).then((res) => {
                if (res.status == "done" && ["finish", "redo", "delete"].includes(res.cmd)) {
                  line.setFlex(res.message.contents, res.message.altText).send();

                } else if (res.status == "done" && ["add"].includes(res.cmd)) {
                  line.setFlex(res.message.contents, res.message.altText)
                  .setText("指定の課題を追加しました。")
                  .send();

                } else if (res.status == "done" && ["config/notify"].includes(res.cmd)) {
                  line.setText(res.message.contents).send();
                }

              }).catch(e => {console.log(e);line.setError(e).send()});

            // 課題手動追加処理
            } else if (message.includes("【☆課題追加フォーム☆】")) {
              const addManualTask = require("./apps/addManualTask");
              addManualTask({
                message: message

              }).then((res) => {
                if (res.status == "done") {
                  line.setFlex(res.message.contents, res.message.altText).send();
                }

              }).catch(e => {console.log(e);line.setError(e).send()});

            // メール通知設定
            } else if (message == "通知設定"){
              const flexContents = require("./data/flexMessage/notifySetting.json");
              line.setFlex(JSON.parse(JSON.stringify(flexContents)
                .replace("$1", (userData.notify ? "9:00に通知" : "通知しない"))),
                "通知設定の変更"
              ).send();

            // メール通知即時Off設定
            } else if (message == "このまま送信して、メール通知をOFFにします＞"){
              const confirmCommand = require("./apps/confirmCommand");
              confirmCommand(db, {
                userId: eventData.source.userId,
                message: "cmd@config?notify=none"

              }).then((res) => {
                if (res.status == "done") {
                  line.setFlex(res.message.contents, res.message.altText).send();
                }

              }).catch(e => {console.log(e);line.setError(e).send()});

            } else if (["eAlps連携設定", "超過課題の表示", "ご意見・ご要望"].includes(message)) {
              line.setText("この項目は準備中です。").send();
            } else { }
            break;
          }
        }
      }
      break;
    }

    return Promise.resolve("done");

  })().catch((e) => {
    console.log(e);
    line.setError(e).send();
  })
}