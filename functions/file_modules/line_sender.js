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
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。\nこのエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });
  }

  alert_only_text(){
    this.client.replyMessage(this.reply_token, {
      type: "text",
      text: "テキストメッセージ以外は\n処理できません<(_ _)>"
    }).catch((err) => {
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });
  }

  alert_error({error_msg="不明なエラー"}){
    console.error("Error occurred!: ", error_msg);
    this.client.replyMessage(this.reply_token, {
      type: "text",
      text: `処理エラーが発生しました。\n${error_msg}`
    }).catch((err) => {
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });
  }

  flex_added_friend(){
    const json_added_friend = require("../data/flex_msg/added_friend.json");
    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: "友達登録ありがとうございます！",
      contents: json_added_friend
    }).catch((err) => {
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });
  }

  flex_auth_guide({address=""}){
    const json_auth_guide = require("../data/flex_msg/auth_guide.json");
    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: `認証メールを${address}に送信しました。`,
      contents: JSON.parse(JSON.stringify(json_auth_guide)
        .replace("$1", address))
    }).catch((err) => {
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });
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
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });
  }

  flex_link_guide({student_id=""}){
    const json_link_guide = require("../data/flex_msg/link_guide.json")
    const user_department = student_id.match(/[LEJSMTAF]/i);
    const term = new Date();
    term.setMonth(term.getMonth()-3);

    const url_1 = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export.php?openExternalBrowser=1`
    const url_2 = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${user_department}/calendar/export.php?openExternalBrowser=1`

    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: "手順に従い、ACSUとの連携を行ってください。",
      contents: JSON.parse(JSON.stringify(json_link_guide)
        .replace("$1", url_1)
        .replace("$2", url_2))
    }).catch((err) => {
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });
  }

  flex_task_list({contents=[], alt_text="", notice_refresh=false, notice_message=""}){
    if (!notice_refresh) {
      this.client.replyMessage(this.reply_token, {
        type: "flex",
        altText: alt_text,
        contents: {
          "type": "bubble",
          "size": "giga",
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": contents
          }
        }
      }).catch((err) => {
        console.error("Error occurred!: ", err);
        this.client.replyMessage(this.reply_token, {
          type: "text",
          text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
        });
      });

    } else {
      this.client.replyMessage(this.reply_token, [{
        type: "flex",
        altText: alt_text,
        contents: {
          "type": "bubble",
          "size": "giga",
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": contents
          }
        }
      },{
        type: "text",
        text: notice_message
      }]).catch((err) => {
        console.error("Error occurred!: ", err);
        this.client.replyMessage(this.reply_token, {
          type: "text",
          text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
        });
      });
    }
  }

  flex_retry_add_task({err_msg="", content=""}){
    const json_retry_add_task = require("../data/flex_msg/retry_add_task.json");
    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: "内容を修正して再度送信してください。",
      contents: JSON.parse(JSON.stringify(json_retry_add_task)
      .replace("$1", err_msg)
      .replace("$2", content.replace(/\n/g, "\\n")))
    }).catch((err) => {
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });

  }

  flex_add_task({content="", task_data={}}){
    const json_add_task = require("../data/flex_msg/add_task.json");
    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: "この内容で課題を追加しますか？",
      contents: JSON.parse(JSON.stringify(json_add_task)
      .replace("$1", task_data.class_name)
      .replace("$2", task_data.task_name)
      .replace("$3", task_data.task_limit)
      .replace("$4", `cmd@add?cn=${task_data.class_name}&tn=${task_data.task_name}&tl=${task_data.task_limit.replace(" ", "-")}`)
      .replace("$5", content.replace(/\n/g, "\\n")))
    }).catch((err) => {
      console.error("Error occurred!: ", err);
      this.client.replyMessage(this.reply_token, {
        type: "text",
        text: `メッセージ送信処理でエラーが発生しました。このエラーが複数回発生する場合は、右下の設定＞サポートより管理者にお問い合わせください。\n${err}`
      });
    });

  }
}

module.exports = Line_Sender;