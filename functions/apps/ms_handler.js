const get_env_rich_menu_id = () => {
  const env_rich_menu = require("../data/richmenu_ids.json");;
  if (process.env.K_REVISION == 1) {
    return env_rich_menu.local;

  } else if (process.env.GCLOUD_PROJECT == "racsu-develop") {
    return env_rich_menu.dev;

  } else if (process.env.GCLOUD_PROJECT == "racsu-shindai") {
    return env_rich_menu.prod;
  }
}

module.exports = async (db, event_data, line_sender) => {
  switch (event_data.type) {

    // フォローアクション
    case "follow": {
      const app_add_user = require("./app_add_user");
      app_add_user(db, {
        user_id: event_data.source.userId,
        user_name: await line_sender.get_name({ id: event_data.source.userId })

      }).then(() => {
        line_sender.flex_added_friend();

      }).catch((e) => {
        line_sender.text_alert({
          error_msg: e
        });
      });
      break;
    }

    // ブロックアクション
    case "unfollow": {
      const app_delete_user = require("./app_delete_user");
      app_delete_user(db, {
        user_id: event_data.source.userId
      });
      break;
    }

    // ポストバックアクション
    case "postback": {
      switch (event_data.postback.data) {
        case "finish_tutorial": {
          const app_load_task = require("./app_load_task");
          app_load_task(db, {
            user_id: event_data.source.userId

          }).then((res) => {
            if (res.result == "ok") {
              line_sender.flex_task_list({
                contents: res.data.contents,
                alt_text: res.data.alt_text,
                notice_refresh: true,
                notice_message: "課題はこのような形で送信されます。\n課題をタップすることで、完了登録ができます。\n\n※何も課題がない場合は表示されません。"
              })
            }

          }).catch((e) => {
            line_sender.text_alert({
              error_msg: e
            });
          });
          break;
        }

        case "add_task": {
          const flex_contents = require("../data/flex_msg/add_task_limit_list.json");
          line_sender.flex({
            contents: flex_contents,
            alt_text: "提出期限を選択してください。"
          });
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
      if (event_data.message.type !== "text") {
        line_sender.text({
          message: `${event_data.message.type}タイプのメッセージは\n受け取ることができません<(_ _)>`
        });
        break;

      } else {
        console.time("ユーザーデータ取得所要時間");
        const account_data = (await db.collection("users").doc(event_data.source.userId).get()).data();
        console.timeEnd("ユーザーデータ取得所要時間");

        switch (account_data.account_status) {

          // 学籍番号の受信処理と認証メールの送信
          case "wait_student_id": {
            const app_add_student_id = require("./app_add_student_id");
            app_add_student_id(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text

            }).then((res) => {
              if (res.result == "ok") {
                line_sender.flex_auth_guide({
                  address: res.data
                });

              } else {
                line_sender.text({
                  message: "はじめに学籍番号を送信してください。"
                });
              }

            }).catch((e) => {
              line_sender.text_alert({
                error_msg: e
              });
            });

            break;
          }


          // 認証トークンの確認と利用規約の送信
          case "confirm_token": {
            const app_confirm_token = require("./app_confirm_token");
            app_confirm_token(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text,
              token: account_data.temporary_data

            }).then((res) => {
              if (res.result == "retry") {
                line_sender.flex_added_friend();
              } else if (res.result == "ok") {
                line_sender.flex_user_policy();
              } else {
                line_sender.text({
                  message: "認証に失敗しました。\nもう一度メールをご確認の上、アルファベットを含めた認証コードを送信してください。\nメール未受信の場合、「初めからやり直す」と送信してください。"
                });
              }

            }).catch((e) => {
              line_sender.text_alert({
                error_msg: e
              });
            });

            break;
          }


          // 規約の同意確認と連携ガイドの送信
          case "authenticated": {
            const app_confirm_agreement = require("./app_confirm_agreement");
            app_confirm_agreement(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text

            }).then((res) => {
              if (res.result == "ok") {
                line_sender.flex_link_guide({
                  student_id: account_data.student_id
                })
              } else {
                line_sender.text({
                  message: "利用を開始するには、規約に同意をお願いします。"
                });
              }

            }).catch((e) => {
              line_sender.text_alert({
                error_msg: e
              });
            });

            break;
          }


          // eAlps連携処理
          case "linking": {
            const app_confirm_cal_url = require("./app_confirm_cal_url");
            app_confirm_cal_url(db, {
              user_id: event_data.source.userId,
              message: event_data.message.text,
              account_data: account_data

            }).then((res) => {
              if (res.result == "continue") {
                line_sender.text({
                  message: "1つ目のURLを登録しました。\n続いて、もう一つのURLも登録してください。"
                });

              } else if (res.result == "ok") {
                const contents = require("../data/flex_msg/start_tutorial.json")
                line_sender.flex({
                  contents: contents,
                  alt_text: "初期設定が完了しました！"
                });

                const env_rich_menu = get_env_rich_menu_id();
                line_sender.link_rich_menu({
                  user_id: event_data.source.userId,
                  rich_menu_id: env_rich_menu["alias-tutorial-1"]
                });

              } else {
                line_sender.text({
                  message: res.msg
                });
              }

            }).catch((e) => {
              line_sender.text_alert({
                error_msg: e
              });
            });

            break;
          }


          // 初期設定完了後のメッセージハンドラ
          case "linked": {
            const message = event_data.message.text;

            // 課題リストの送信
            if (message == "登録済みの課題を表示" || message == "このまま送信して、今日の課題の詳細を表示＞＞＞") {
              const app_load_task = require("./app_load_task");
              app_load_task(db, {
                user_id: event_data.source.userId

              }).then((res) => {
                if (res.result == "ok") {
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text
                  })
                }

              }).catch((e) => {
                line_sender.text_alert({
                  error_msg: e
                });
              });


              // 課題の更新
            } else if (message == "データを更新する") {
              const env_rich_menu = get_env_rich_menu_id();

              line_sender.link_rich_menu({
                user_id: event_data.source.userId,
                rich_menu_id: env_rich_menu["alias-list-menu-overlay"]
              });

              const app_update_task = require("./app_update_task");
              app_update_task(db, {
                user_id: event_data.source.userId,
                account_data: account_data

              }).then((res) => {
                if (res.result == "ok") {
                  line_sender.link_rich_menu({
                    user_id: event_data.source.userId,
                    rich_menu_id: env_rich_menu["alias-list-menu"]
                  });
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text,
                    notice_refresh: true,
                    notice_message: "課題を最新に更新しました。"
                  });

                } else if (res.result == "no task") {
                  line_sender.text({
                    message: "新規取得できる課題がありません。"
                  })
                }

              }).catch((e) => {
                line_sender.text_alert({
                  error_msg: e
                });
              });

              // その他のコマンド処理
            } else if (message.includes("cmd@")) {
              const app_confirm_command = require("./app_confirm_command");
              app_confirm_command(db, {
                user_id: event_data.source.userId,
                message: message

              }).then((res) => {
                if (res.result == "ok" && res.res_type == "task_list") {
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text
                  });

                } else if (res.result == "ok" && res.res_type == "task_list_added") {
                  line_sender.flex_task_list({
                    contents: res.data.contents,
                    alt_text: res.data.alt_text,
                    notice_refresh: true,
                    notice_message: "指定の課題を追加しました。"
                  });

                } else if (res.result == "ok" && res.res_type == "message") {
                  line_sender.text({
                    message: res.message
                  });
                }

              }).catch((e) => {
                line_sender.text_alert({
                  error_msg: e
                });
              });

              // 課題手動追加処理
            } else if (message.includes("【☆課題追加フォーム☆】")) {
              const app_add_manual_task = require("./app_add_manual_task");
              app_add_manual_task(db, {
                user_id: event_data.source.userId,
                message: message

              }).then((res) => {
                if (res.result == "ok") {
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
                line_sender.text_alert({
                  error_msg: e
                });
              });

            } else if (message == "通知設定"){
              line_sender.flex_config_notify({
                now_state: account_data.notify
              });

            } else if (message == "このまま送信して、メール通知をOFFにします＞"){
              const app_confirm_command = require("./app_confirm_command");
              app_confirm_command(db, {
                user_id: event_data.source.userId,
                message: "cmd@config?notify=none"

              }).then((res) => {
                if (res.result == "ok" && res.res_type == "message") {
                  line_sender.text({
                    message: res.message
                  });
                }

              }).catch((e) => {
                line_sender.text_alert({
                  error_msg: e
                });
              });

            } else if (message == "eAlps連携設定" || message == "超過課題の表示" || message == "ご意見・ご要望") {
              line_sender.text({
                message: "この項目はまだ未実装です…"
              })
            } else { }
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