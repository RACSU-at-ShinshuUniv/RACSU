// FlexMessage読み込み
const json_added_friend = require("../flex_data/added_friend.json");
const json_auth_guide = require("../flex_data/auth_guide.json");
const json_terms_of_service = require("../flex_data/terms_of_service.json");
const json_link_guide = require("../flex_data/link_guide.json")

// ----------------------------------------------
// テキストメッセージ
// ----------------------------------------------
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


// ----------------------------------------------
// アラートメッセージ
// ----------------------------------------------
exports.alert_error = ({client="", reply_token="", error_msg="Error_msg not detected."}) => {
  client.replyMessage(reply_token, {
    type: "text",
    text: `処理エラーが発生しました。\n${error_msg}`
  });
}


// ----------------------------------------------
// Flexメッセージ
// ----------------------------------------------
exports.flex_added_friend = ({client="", reply_token=""}) => {
  client.replyMessage(reply_token, {
    type: "flex",
    altText: "友達登録ありがとうございます！",
    contents: json_added_friend
  })
}

exports.flex_link_guide = ({client="", reply_token="", url_1="", url_2=""}) => {
  client.replyMessage(reply_token, {
    type: "flex",
    altText: "手順に従い、ACSUとの連携を行ってください。",
    contents: JSON.parse(JSON.stringify(json_link_guide)
      .replace("$1", url_1)
      .replace("$2", url_2))
  })
}