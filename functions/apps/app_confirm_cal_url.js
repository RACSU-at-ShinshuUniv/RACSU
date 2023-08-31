module.exports = async(db, {user_id="", message="", account_data={}}) => {
  const url_param = message.split(/[/=&?]/);
  if (message.indexOf("https://lms.ealps.shinshu-u.ac.jp/") == -1 || url_param[6] !== "export_execute.php"){
    // URLエクスポート先のスクリプトが含まれるか
    return Promise.reject("URL形式が不正です。eAlpsのカレンダーエクスポートURLのみ有効です。");

  } else if (url_param.length !== 15){
    // URLパラメータ数が正規数含まれるか
    return Promise.reject("URL形式が不正です。\nURLが最後までコピーされていない可能性があります。\nもう一度最後までコピーし、送信してください。");

  } else {
    const term = new Date();
    term.setMonth(term.getMonth()-3);
    const user_department = user_id.match(/[LEJSMTAF]/i);
    const url_param_department = url_param[url_param.indexOf(term.getFullYear().toString())+1];
    const url_param_userid = url_param[url_param.indexOf("userid")+1];
    const url_param_authtoken = url_param[url_param.indexOf("authtoken")+1];

    const url = (url_param_department == "g")
    ? `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export_execute.php?userid=${url_param_userid}&authtoken=${url_param_authtoken}&preset_what=all&preset_time=recentupcoming`
    : `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${user_department}/calendar/export_execute.php?userid=${url_param_userid}&authtoken=${url_param_authtoken}&preset_what=all&preset_time=recentupcoming`;

    console.log(url);

    const ical = require("../file_modules/ical_fetch");
    if (!(await ical.is_valid_url({url: url}))){
      // 登録済みの学部コードを使って実際にFitchしてみて、正しいデータが取れるか
      // 登録済みの学部と違うURLが送られてきた場合にエラーを出すようにする
      return Promise.reject("URLの有効性が確認できません。\n有効なURLを送信してください。");

    } else {
      // エラーチェック通過

      if (url_param_department == "g"){
        db.collection("users").doc(user_id).update({
          moodle_general_id: url_param_userid,
          moodle_general_token: url_param_authtoken,
          account_status: "linked"
        });

      } else {
        db.collection("users").doc(user_id).update({
          moodle_specific_id: url_param_userid,
          moodle_specific_token: url_param_authtoken,
          account_status: "linked"
        });
      }

      if ((account_data.moodle_general_id !== "" && url_param_department == user_department) || (account_data.moodle_specific_id !== "" && url_param_department == "g")){
        // 2つとも正常追加完了
        return Promise.resolve("complete");
      } else {
        return Promise.resolve("continue");
      }
    }
  }
}