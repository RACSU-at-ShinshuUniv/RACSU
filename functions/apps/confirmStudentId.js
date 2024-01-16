module.exports = async(db, {userId="", message=""}) => {
  const studentId = message.match(/\d\d[LEJSMTAF]\d\d\d\d./i);

  if (studentId == null){
    return Promise.resolve({status: "error"});

  } else {
    const userAddress = `${studentId.toString().toLowerCase()}@shinshu-u.ac.jp`;

    // 認証トークン作成
    let userToken = "a";
    for (let i=0; i<3; i++){
      userToken += Math.floor(Math.random()*10).toString();
    }

    // 認証メール送信
    const MailClient = require("../lib/MailClient");
    const mailAccount = require("../data/keys/MailAccount.json")
    const mailClient = new MailClient(mailAccount);
    mailClient.authMail(userToken).sendTo(userAddress);

    // 認証データ書き込み
    db.collection("users").doc(userId).update({
      accountStatus: "confirm_token",
      studentId: studentId.toString().toLowerCase(),
      tempData: userToken
    });

    const flexContents = require("../data/flexMessage/authGuide.json");

    return Promise.resolve({
      status: "done",
      message: {
        contents: JSON.parse(JSON.stringify(flexContents).replace("$1", userAddress)),
        altText: `認証メールを${userAddress}に送信しました。`
      }
    });
  }
}