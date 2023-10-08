const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

module.exports = async({method="", address="@shinshu-u.ac.jp", data={}}) => {
  if (address == "@shinshu-u.ac.jp"){
    return Promise.reject({result: "error"});
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "racsu.shinshu.univ@gmail.com",
      pass: process.env.MAIL_PASS
    }
  });

  if (method == "auth"){
    const content = fs.readFileSync(path.resolve(__dirname, "../data/mail/auth.html")).toString();
    const mailOptions = {
      from: "RACSU 信州大学メール認証<racsu.shinshu.univ@gmail.com>",
      to: address,
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
      to: address,
      subject: data.title,
      html: contents
    };
    try{
      await transporter.sendMail(mailOptions)
      return Promise.resolve({result: "ok"})
    }catch(e){
      return Promise.reject(e)
    }
  }
}