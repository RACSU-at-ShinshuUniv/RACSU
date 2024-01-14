module.exports = async(db, {userId="", message="", userData={}}) => {
  // URLをパラメータ分割
  const urlParams = message.split(/[/=&?]/);

  // URLエラーチェック
  if (message.indexOf("https://lms.ealps.shinshu-u.ac.jp/") == -1 || urlParams[6] !== "export_execute.php"){
    // URLエクスポート先のスクリプトが含まれるか
    if (message.indexOf("https://") == -1){
      return Promise.resolve({status: "error", message: {contents: "URLの登録完了まで機能の利用・メッセージの送信が行えません。\n上の画像メニューを見ながら、登録を完了させてください。"}});
    } else {
      return Promise.resolve({status: "error", message: {contents: "URL形式が不正です。eAlpsのカレンダーエクスポートURLのみ有効です。"}});
    }

  } else if (urlParams.length !== 15){
    // URLパラメータ数が正規数含まれるか
    return Promise.resolve({status: "error", message: {contents: "URL形式が不正です。\nURLが最後までコピーされていない可能性があります。\nもう一度最後までコピーし、送信してください。"}});
  }

  // パラメーターからIDとToken分割
  const term = new Date();
  term.setMonth(term.getMonth()-3);
  const userDepartment = userData.studentId.match(/[LEJSMTAF]/i);
  const urlParamsDepartment = urlParams[urlParams.indexOf(term.getFullYear().toString())+1];
  const urlParamsId = urlParams[urlParams.indexOf("userid")+1];
  const urlParamsToken = urlParams[urlParams.indexOf("authtoken")+1];

  // URL再作成
  const url = (urlParamsDepartment == "g")
  ? `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export_execute.php?userid=${urlParamsId}&authtoken=${urlParamsToken}&preset_what=all&preset_time=recentupcoming`
  : `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${userDepartment}/calendar/export_execute.php?userid=${urlParamsId}&authtoken=${urlParamsToken}&preset_what=all&preset_time=recentupcoming`;

  const IcalClient = require("../lib/IcalClient");
  if (!await (new IcalClient(url).isValidUrl())){
    // 登録済みの学部コードを使って実際にFitchしてみて、正しいデータが取れるか
    // 登録済みの学部と違うURLが送られてきた場合にエラーを出すようにする
    return Promise.resolve({status: "error", message: {contents: "URLの有効性が確認できません。\n有効なURLを送信してください。"}});
  }

  // エラーチェック通過
  if ((userData.moodleGeneralId !== "" && urlParamsDepartment == userDepartment) || (userData.moodleSpecificId !== "" && urlParamsDepartment == "g")){
    // 2つとも正常追加完了
    if (urlParamsDepartment == "g"){
      db.collection("users").doc(userId).update({
        moodleGeneralId: urlParamsId,
        moodleGeneralToken: urlParamsToken,
        accountStatus: "linked"
      });
      userData.moodleGeneralId = urlParamsId;
      userData.moodleGeneralToken = urlParamsToken;
      userData.accountStatus = "linked";

    } else {
      db.collection("users").doc(userId).update({
        moodleSpecificId: urlParamsId,
        moodleSpecificToken: urlParamsToken,
        accountStatus: "linked"
      });
      userData.moodleSpecificId = urlParamsId;
      userData.moodleSpecificToken = urlParamsToken;
      userData.accountStatus = "linked";
    }

    // バックグラウンドで課題を更新
    const updateTask = require("./updateTask");
    updateTask(db, {
      userId: userId,
      userData: userData
    });
    const flexContents = require("../data/flexMessage/startTutorial.json");
    return Promise.resolve({status: "done", message: {contents: flexContents, altText: "初期設定が完了しました！"}});


  // どちらか一方のURLのみ登録
  } else {
    if (urlParamsDepartment == "g"){
      db.collection("users").doc(userId).update({
        moodleGeneralId: urlParamsId,
        moodleGeneralToken: urlParamsToken
      });
      return Promise.resolve({status: "continue", message: {contents: "「設定A」の登録が完了しました。\n続いて「設定B」の登録に進んでください。"}});

    } else {
      db.collection("users").doc(userId).update({
        moodleSpecificId: urlParamsId,
        moodleSpecificToken: urlParamsToken
      });
      return Promise.resolve({status: "continue", message: {contents: "「設定B」の登録が完了しました。\n続いて「設定A」の登録に進んでください。"}});
    }
  }
}