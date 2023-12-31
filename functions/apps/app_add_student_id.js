module.exports = async(db, {user_id="", message=""}) => {
  const student_id = message.match(/\d\d[LEJSMTAF]\d\d\d\d./i);

  if (student_id == null){
    return Promise.resolve({result: "error"});

  } else {
    const user_address = `${student_id.toString().toLowerCase()}@shinshu-u.ac.jp`;

    // 認証トークン作成
    let user_token = "a";
    for (let i=0; i<3; i++){
      user_token += Math.floor(Math.random()*10).toString();
    }

    // 認証メール送信
    const mail_sender = require("../file_modules/mail_sender");
    mail_sender({
        method: "auth",
        address: user_address,
        data: {
          token: user_token
        }
    });

    // 認証データ書き込み
    db.collection("users").doc(user_id).update({
      account_status: "confirm_token",
      student_id: student_id.toString().toLowerCase(),
      temporary_data: user_token
    });

    return Promise.resolve({result:"ok", data: user_address});
  }
}