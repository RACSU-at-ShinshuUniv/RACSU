class Line_Sender {
  constructor({client="", reply_token=""}){
    this.client = client;
    this.reply_token = reply_token;
  }

  async get_name({id=""}){
    const user_name = (await this.client.getProfile(id)).displayName
    return user_name;
  }


  text({message=""}){
    this.client.replyMessage(this.reply_token, {
      type: 'text',
      text: `${message}`
    });
  }

  alert_only_text(){
    this.client.replyMessage(this.reply_token, {
      type: "text",
      text: "テキストメッセージ以外は\n処理できません<(_ _)>"
    });
  }

  alert_error({error_msg="Error_msg not detected."}){
    this.client.replyMessage(this.reply_token, {
      type: "text",
      text: `処理エラーが発生しました。\n${error_msg}`
    });
  }

  flex_added_friend(){
    const json_added_friend = require("../flex_data/added_friend.json");
    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: "友達登録ありがとうございます！",
      contents: json_added_friend
    });
  }

  flex_auth_guide({address=""}){
    const json_auth_guide = require("../flex_data/auth_guide.json");
    this.client.replyMessage(this.reply_token, {
      type: "flex",
      altText: `認証メールを${address}に送信しました。`,
      contents: JSON.parse(JSON.stringify(json_auth_guide)
        .replace("$1", address))
    });
  }

  flex_user_policy(){
    const json_user_policy = require("../flex_data/user_policy.json")
    this.client.replyMessage(this.reply_token, [{
      type: "text",
      text: "認証が完了しました。"
    },{
      type: "flex",
      altText: "利用規約をご確認ください。",
      contents: json_user_policy
    }]);
  }

  flex_link_guide({student_id=""}){
    const json_link_guide = require("../flex_data/link_guide.json")
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
    });
  }
}

module.exports = Line_Sender;