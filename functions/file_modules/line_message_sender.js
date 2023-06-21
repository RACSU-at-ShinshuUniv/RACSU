// FlexMessage読み込み
const json_auth_guide1 = require("../flex_data/auth_guide1.json");
const json_auth_guide2 = require("../flex_data/auth_guide2.json");
const json_terms_of_service = require("../flex_data/terms_of_service.json");
const json_link_guide = require("../flex_data/link_guide.json")


exports.text_parrot_returner = ({client="", reply_token="", message=""}) => {
  client.replyMessage(reply_token, {
    type: 'text',
    text: `${message}を受け取りました。`
  });
}

exports.alert_only_text = ({client="", reply_token=""}) => {
  client.replyMessage(reply_token, {
    type: "text",
    text: "テキストメッセージ以外は\n処理できません<(_ _)>"
  });
}

exports.alert_error = ({client="", reply_token="", error_msg="Error_msg not detected."}) => {
  client.replyMessage(reply_token, {
    type: "text",
    text: `処理エラーが発生しました。\n${error_msg}`
  });
}

exports.flex_auth_guide1 = ({client="", reply_token=""}) => {

}

exports.send_flex = (is_enable) => {
  if (!is_enable){
    return
  }

  client.pushMessage("U5a2991011c7a349ab5c5bebc4347cfb6", {
    type: "flex",
    altText: "友達登録ありがとうございます！",
    contents: JSON.parse(JSON.stringify(link_guide)
      .replace("$1", "https://www.google.com/")
      .replace("$2", "https://www.google.com/")
    )
  });
}