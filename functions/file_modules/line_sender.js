class Line_Sender {
  constructor({client="", reply_token=""}){
    this.client = client;
    this.reply_token = reply_token;
  }

  async get_name({id=""}){
    const user_name = (await this.client.getProfile(id)).displayName
    return user_name;
  }

  link_rich_menu({user_id="", rich_menu_id=""}){
    this.client.linkRichMenuToUser(user_id, rich_menu_id);
  }

  contents_push({user_id="", contents={}}){
    this.client.pushMessage(user_id, contents);
  }

  contents_reply({contents={}}){
    this.client.replyMessage(this.reply_token, contents);
  }

  text({message=""}){
    this.client.replyMessage(this.reply_token, {
      type: 'text',
      text: `${message}`
    }).catch((err) => {
      console.error("メッセージ送信エラー", err);
      console.error(err.originalError.response.data);
    });
  }

  text_alert({error_msg="不明なエラー"}){
    console.error("メッセージ送信エラー", error_msg);
    this.client.replyMessage(this.reply_token, {
      type: "text",
      text: `処理エラーが発生しました。\n${error_msg}`
    }).catch((err) => {
      console.error("メッセージ送信エラー", err);
      console.error(err.originalError.response.data);
    });
  }

  flex({contents={}, alt_text=""}){
    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: alt_text,
      contents: contents
    }).catch((err) => {
      console.error("メッセージ送信エラー", err);
      console.error(err.originalError.response.data);
    });
  }



  flex_added_friend(){
    const flex_contents = require("../data/flex_msg/added_friend.json");
    this.flex({
      contents: flex_contents,
      alt_text: "友だち追加ありがとうございます！"
    });
  }

  flex_auth_guide({address=""}){
    const flex_contents = require("../data/flex_msg/auth_guide.json");
    this.flex({
      contents: JSON.parse(JSON.stringify(flex_contents)
        .replace("$1", address)),
      alt_text: `認証メールを${address}に送信しました。`
    })
  }

  flex_user_policy(){
    const json_user_policy = require("../data/flex_msg/user_policy.json")
    this.client.replyMessage(this.reply_token, [{
      type: "text",
      text: "認証が完了しました。"
    },{
      type: "flex",
      altText: "利用規約をご確認ください。",
      contents: json_user_policy
    }]).catch((err) => {
      console.error("メッセージ送信エラー", err);
      console.error(err.originalError.response.data);
    });
  }

  flex_link_guide({student_id=""}){
    const flex_contents = require("../data/flex_msg/link_guide.json")
    const user_department = student_id.match(/[LEJSMTAF]/i);
    const term = new Date();
    term.setMonth(term.getMonth()-3);

    const url_1 = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export.php?openExternalBrowser=1`;
    const url_2 = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${user_department}/calendar/export.php?openExternalBrowser=1`;

    this.flex({
      contents: JSON.parse(JSON.stringify(flex_contents)
        .replace("$1", url_1)
        .replace("$2", url_2)),
      alt_text: "手順に従い、ACSUとの連携を行ってください。"
    });
  }

  flex_task_list({contents={}, alt_text="", notice_refresh=false, notice_message=""}){
    if (!notice_refresh) {
      this.flex({
        contents: contents,
        alt_text: alt_text
      });

    } else {
      this.client.replyMessage(this.reply_token, [{
        type: "flex",
        contents: contents,
        altText: alt_text
      },{
        type: "text",
        text: notice_message
      }]).catch((err) => {
        console.error("メッセージ送信エラー", err);
        console.error(err.originalError.response.data);
      });
    }
  }

  flex_retry_add_task({err_msg="", content=""}){
    const flex_contents = require("../data/flex_msg/retry_add_task.json");
    this.flex({
      contents: JSON.parse(JSON.stringify(flex_contents)
      .replace("$1", err_msg)
      .replace("$2", content.replace(/\n/g, "\\n"))),
      alt_text: "内容を修正して再度送信してください。"
    });
  }

  flex_add_task({content="", task_data={}}){
    const flex_contents = require("../data/flex_msg/add_task.json");
    this.flex({
      contents: JSON.parse(JSON.stringify(flex_contents)
      .replace("$1", task_data.class_name)
      .replace("$2", task_data.task_name)
      .replace("$3", task_data.task_limit)
      .replace("$4", `cmd@add?cn=${task_data.class_name}&tn=${task_data.task_name}&tl=${task_data.task_limit.replace(" ", "-")}`)
      .replace("$5", content.replace(/\n/g, "\\n"))),
      alt_text: "この内容で課題を追加しますか？"
    });
  }

  flex_config_notify({now_state=""}){
    const flex_contents = require("../data/flex_msg/config_notify.json");
    if (now_state){
      this.flex({
        contents: JSON.parse(JSON.stringify(flex_contents)
        .replace("$1", "9:00に通知")),
        alt_text: "通知設定の変更"
      });

    } else {
      this.flex({
        contents: JSON.parse(JSON.stringify(flex_contents)
        .replace("$1", "通知しない")),
        alt_text: "通知設定の変更"
      });
    }
  }
}

module.exports = Line_Sender;