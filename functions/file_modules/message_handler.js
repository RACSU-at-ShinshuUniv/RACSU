// 自作モジュール追加
const Line_Sender = require("./line_sender");
const firestore_read = require("./firestore_read");
const firestore_write = require("./firestore_write");
const mail_sender = require("./mail_sender")
const ical = require("./ical_fetch")
const data_formatter = require("./data_formatter")

exports.set_client = async({client=null, reply_token=""}) => {
  this.line_sender = new Line_Sender({
    client: client,
    reply_token: reply_token
  });
}

exports.handle = async({event_data=""}) => {
  // フォローアクション
  if (event_data.type == "follow"){
    this.line_sender.flex_added_friend();
    // console.log(event_data.source.userId, await this.line_sender.get_name({id: event_data.source.userId}))
    firestore_write.add_user({
      user_id: event_data.source.userId,
      user_name: await this.line_sender.get_name({id: event_data.source.userId})
    });

  // ブロックアクション
  } else if (event_data.type == "unfollow"){
    firestore_write.delete_user({
      user_id: event_data.source.userId
    });

  // ポストバックアクション
  } else if (event_data.type == "postback"){

  // メッセージアクション
  } else if (event_data.type == "message"){
    // テキストメッセージのみ処理
    if (event_data.message.type == "text"){
      const account_data = await firestore_read.get_account_data({
        user_id: event_data.source.userId
      });

      switch(account_data.account_status){
        case "authenticating": {
          accept_student_id({
            event_data: event_data
          });
          return;
        }

        case "confirm_token": {
          if (event_data.message.text == "初めからやり直す"){
            this.line_sender.flex_added_friend();
            firestore_write.set_data({
              collection: "users",
              doc: event_data.source.userId,
              data: {
                account_status: "authenticating",
                student_id: "",
                temporary_data: ""
              }
            });

          } else if (event_data.message.text == account_data.temporary_data){
            this.line_sender.flex_user_policy();
            firestore_write.set_data({
              collection: "users",
              doc: event_data.source.userId,
              data: {
                account_status: "authenticated",
                temporary_data: ""
              }
            });

          } else {
            this.line_sender.text({
              message: "認証に失敗しました。\nもう一度メールをご確認の上、アルファベットを含めた認証コードを送信してください。\nメール未受信の場合、「初めからやり直す」と送信してください。"
            });
          }
          return;
        }

        case "authenticated": {
          if (event_data.message.text == "利用規約に同意し、\n初期設定を開始する"){
            this.line_sender.flex_link_guide({
              student_id: account_data.student_id
            })
            firestore_write.set_data({
              collection: "users",
              doc: event_data.source.userId,
              data: {
                account_status: "linking",
              }
            });

          } else {
            this.line_sender.text({
              message: "利用するには、利用規約に同意をお願いします。"
            });
          }
          return;
        }

        case "linking": {
          set_calendar_url({
            event_data: event_data,
            account_data: account_data
          })
          return;
        }

        case "linked": {
          switch (event_data.message.text){
            case "課題を表示": {
              // Firestoreから課題データ取得
              const tasks = await firestore_read.get_task({
                user_id: event_data.source.userId
              });

              // Firestore保存形式をflexデータに変換
              const flex_data = data_formatter.json_to_flex({
                tasks: tasks
              });

              // LINE送信
              this.line_sender.flex_task_list({
                contents: flex_data.contents,
                alt_text: flex_data.alt_text
              })
              return;
            }

            case "課題を更新":{
              // ical取得先URLを取得
              const url = await firestore_read.get_cal_url({
                user_id: event_data.source.userId
              });

              // icalデータを取得
              const ical_data_general = await ical.get_contents({
                url: url.general
              })
              const ical_data_specific = await ical.get_contents({
                url: url.specific
              })

              // icalデータをFirestore保存形式に変換
              const task_data_general = await data_formatter.ical_to_json({
                ical_data: ical_data_general
              })
              const task_data_specific = await data_formatter.ical_to_json({
                ical_data: ical_data_specific
              })

              // Firestore保存形式をflexデータに変換
              const flex_data = data_formatter.json_to_flex({
                tasks: {...task_data_general, ...task_data_specific}
              });

              // Firestoreに保存
              firestore_write.set_data({
                collection: "tasks",
                doc: event_data.source.userId,
                data: {...task_data_general, ...task_data_specific}
              });

              // LINE送信
              this.line_sender.flex_task_list({
                contents: flex_data.contents,
                alt_text: flex_data.alt_text,
                refresh: true
              });
              return;
            }
          }
          return;
        }
      }

    // テキストメッセージ以外は除外
    } else {
      this.line_sender.text({
        message: `${event_data.message.type}タイプのメッセージは\n受け取ることができません<(_ _)>`
      });
    }

  } else {
    this.line_sender.text({
      message: "このアクションはサポートされていません。"
    });
  }
  return Promise.resolve("done");
}

exports.error = ({err=""}) => {
  this.line_sender.alert_error({
    error_msg: err.message
  });
}


const accept_student_id = async({event_data=""}) => {
  const student_id = event_data.message.text.match(/\d\d[LEJSMTAF]\d\d\d\d./i);
  if (student_id !== null){
    const user_address = `${student_id.toString().toLowerCase()}@shinshu-u.ac.jp`;

    // 認証トークン作成
    let user_token = "a";
    for (let i=0; i<5; i++){
      user_token += Math.floor(Math.random()*10).toString();
    }

    // 認証メール送信
    mail_sender({
      data: {
        method: "auth",
        address: user_address,
        token: user_token
      }
    });

    // 認証メッセージ送信
    this.line_sender.flex_auth_guide({
      address: user_address
    });

    // 認証データ書き込み
    firestore_write.set_data({
      collection: "users",
      doc: event_data.source.userId,
      data: {
        account_status: "confirm_token",
        student_id: student_id.toString().toLowerCase(),
        temporary_data: user_token
      }
    });

  } else {
    this.line_sender.text({
      message: "学籍番号を認識できませんでした。\nもう一度送信してください。"
    });
  }
}

const set_calendar_url = async({event_data="", account_data={}}) => {
  const url_param = event_data.message.text.split(/[/=&?]/);
  if (event_data.message.text.indexOf("https://lms.ealps.shinshu-u.ac.jp/") == -1 || url_param[6] !== "export_execute.php"){
    // URLエクスポート先のスクリプトが含まれるか
    this.line_sender.text({
      message: "URL形式が不正です。eAlpsのカレンダーエクスポートURLのみ有効です。"
    });

  } else if (url_param.length !== 15){
    // URLパラメータ数が正規数含まれるか
    this.line_sender.text({
      message: "URL形式が不正です。\nURLが最後までコピーされていない可能性があります。\nもう一度最後までコピーし、送信してください。"
    });

  } else {
    const term = new Date();
    term.setMonth(term.getMonth()-3);
    const user_department = account_data.student_id.match(/[LEJSMTAF]/i);
    const url_param_department = url_param[url_param.indexOf(term.getFullYear().toString())+1];
    const url_param_userid = url_param[url_param.indexOf("userid")+1];
    const url_param_authtoken = url_param[url_param.indexOf("authtoken")+1];

    const url = (url_param_department == "g")
    ? `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export_execute.php?userid=${url_param_userid}&authtoken=${url_param_authtoken}&preset_what=all&preset_time=recentupcoming`
    : `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${user_department}/calendar/export_execute.php?userid=${url_param_userid}&authtoken=${url_param_authtoken}&preset_what=all&preset_time=recentupcoming`;

    console.log(url)

    if (!(await ical.is_valid_url({url: url}))){
      // 登録済みの学部コードを使って実際にFitchしてみて、正しいデータが取れるか
      // 登録済みの学部と違うURLが送られてきた場合にエラーを出すようにする
      this.line_sender.text({
        message: "URLの有効性が確認できません。\n有効なURLを送信してください。"
      });

    } else {
      // エラーチェック通過
      if ((account_data.moodle_general_id !== "" && url_param_department == user_department)|| (account_data.moodle_specific_id !== "" && url_param_department == "g")){
        // 2つとも正常追加完了
        this.line_sender.text({
          message: "初期設定が完了しました！"
        });

        if (url_param_department == "g"){
          firestore_write.set_data({
            collection: "users",
            doc: event_data.source.userId,
            data: {
              moodle_general_id: url_param_userid,
              moodle_general_token: url_param_authtoken,
              account_status: "linked"
            }
          });

        } else {
          firestore_write.set_data({
            collection: "users",
            doc: event_data.source.userId,
            data: {
              moodle_specific_id: url_param_userid,
              moodle_specific_token: url_param_authtoken,
              account_status: "linked"
            }
          });
        }

      } else {
        // 1つ目の追加
        this.line_sender.text({
          message: "1つ目のURLを登録しました。\n続いて、もう一つのURLも登録してください。"
        });

        if (url_param_department == "g"){
          firestore_write.set_data({
            collection: "users",
            doc: event_data.source.userId,
            data: {
              moodle_general_id: url_param_userid,
              moodle_general_token: url_param_authtoken
            }
          });

        } else {
          firestore_write.set_data({
            collection: "users",
            doc: event_data.source.userId,
            data: {
              moodle_specific_id: url_param_userid,
              moodle_specific_token: url_param_authtoken
            }
          });
        }
      }
    }
  }
}