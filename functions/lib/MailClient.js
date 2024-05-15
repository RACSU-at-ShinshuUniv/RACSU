const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const _mailOptions = Symbol();
const _client = Symbol();

class MailClient{
  constructor(mailAccount){
    this[_client] = nodemailer.createTransport({
      service: 'gmail',
      secure: true,
      auth: mailAccount
    });
  }

  authMail(token){
    const htmlContents = fs.readFileSync(path.resolve(__dirname, "../data/mail/auth.html")).toString();
    const mailOptions = {
      from: "RACSU 信州大学メール認証<racsu.shinshu.univ@gmail.com>",
      to: "",
      subject: "認証コードのお知らせ",
      html: htmlContents.replace("$1", token)
    };
    return new Sender(this[_client], mailOptions);
  }

  taskNotify(htmlTask){
    const htmlContents = fs.readFileSync(path.resolve(__dirname, "../data/mail/notify.html")).toString();
    const mailOptions = {
      from: "RACSU 課題通知<racsu.shinshu.univ@gmail.com>",
      to: "",
      subject: htmlTask.title,
      html: (htmlContents
        .replace("$1", htmlTask.headerText)
        .replace("$2", htmlTask.today)
        .replace("$3", htmlTask.footerText)
        .replace("<htmlContents_today></htmlContents_today>", htmlTask.html.today)
        .replace("<htmlContents_tomorrow></htmlContents_tomorrow>", htmlTask.html.tomorrow))
    };
    return new Sender(this[_client], mailOptions);
  }


}

class Sender{
  constructor(client, mailOptions){
    this[_mailOptions] = mailOptions;
    this[_client] = client;
  }

  async sendTo(address){
    const activeAddress = (() => {
      if (!(process.env.GCLOUD_PROJECT == "racsu-shindai")){
        console.log(`開発環境のため、メール送信先を上書きします。（${address} -> racsu.shinshu.univ@gmail.com）`)
        return "racsu.shinshu.univ@gmail.com"
      } else {
        return address;
      }
    })();

    this[_mailOptions].to = activeAddress;

    try{
      await this[_client].sendMail(this[_mailOptions]);
      return Promise.resolve(activeAddress);

    }catch(e){
      return Promise.reject();
    }
  }
}

module.exports = MailClient;