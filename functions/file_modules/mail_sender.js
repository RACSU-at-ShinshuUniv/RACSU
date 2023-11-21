const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

module.exports = async({method="", address="@shinshu-u.ac.jp", data={}}) => {
  if (address == "@shinshu-u.ac.jp"){
    return Promise.reject({result: "error"});
  }

  let address_use;
  if (!(process.env.GCLOUD_PROJECT == "racsu-shindai")){
    console.log(`開発環境のため、メール送信先を上書きします。（${address} -> racsu.shinshu.univ@gmail.com）`)
    address_use = "racsu.shinshu.univ@gmail.com"
  } else {
    address_use = address;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
      user: "racsu.shinshu.univ@gmail.com",
      pass: process.env.MAIL_PASS
    }
  });

  if (method == "auth"){
    const content = fs.readFileSync(path.resolve(__dirname, "../data/mail/auth.html")).toString();
    const mailOptions = {
      from: "RACSU 信州大学メール認証<racsu.shinshu.univ@gmail.com>",
      to: address_use,
      subject: "認証コードのお知らせ",
      html: content.replace("$1", data.token)
    };
    try{
      await transporter.sendMail(mailOptions)
      return Promise.resolve({result: "ok"})
    }catch(e){
      return Promise.reject(e)
    }

  } else if (method == "notify"){
    const contents_base = fs.readFileSync(path.resolve(__dirname, "../data/mail/notify.html")).toString();
    const contents = contents_base
    .replace("$1", data.header_text)
    .replace("$2", data.today)
    .replace("$3", data.footer_text)
    .replace("<contents_today></contents_today>", data.contents_today)
    .replace("<contents_tomorrow></contents_tomorrow>", data.contents_tomorrow);

    const mailOptions = {
      from: "RACSU 課題通知<racsu.shinshu.univ@gmail.com>",
      to: address_use,
      subject: data.title,
      html: contents
    };
    try{
      await transporter.sendMail(mailOptions)
      return Promise.resolve({result: "ok"})
    }catch(e){
      return Promise.reject(e)
    }

  } else if (method == "test"){
    const content = "返信不要<br>これは、メール通知の送信テストです。"
    const mailOptions = {
      from: "RACSU 課題通知<racsu.shinshu.univ@gmail.com>",
      to: address_use,
      subject: "【テスト送信】課題通知",
      html: content
    };
    try{
      await transporter.sendMail(mailOptions)
      return Promise.resolve({result: "ok", status: "sended"})
    }catch(e){
      return Promise.reject(e)
    }
  }
}