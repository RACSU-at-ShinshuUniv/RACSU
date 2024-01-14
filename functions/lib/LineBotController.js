const lineBotSDK = require("@line/bot-sdk");

class LineBotController extends lineBotSDK.Client {
  constructor({channelSecret="", channelAccessToken=""}){
    super({
      channelSecret: channelSecret,
      channelAccessToken: channelAccessToken
    });
    this.messageContents = [];
  }

  setUserId(userId){
    this.userId = userId;
    return this;
  }

  setReplyToken(replyToken){
    this.replyToken = replyToken;
    return this;
  }

  setText(text){
    this.messageContents.push({
      type: "text",
      text: text
    });
    return this;
  }

  setError(error){
    console.log(`処理中にエラーが発生しました。\n${error}`);
    this.setText(`処理中にエラーが発生しました。\n${error}`);
    this.setText("このエラーが複数回発生する場合は、下部メニューの設定＞ご意見・ご要望よりお問い合わせください。");
    return this;
  }

  setFlex(flexContents, altText){
    this.messageContents.push({
      type: "flex",
      contents: flexContents,
      altText: altText
    });
    return this;
  }

  async send(){
    if (this.messageContents == []){
      return Promise.reject("Message not set.")
    }
    if (this.replyToken !== undefined){
      try{
        const res = await super.replyMessage(this.replyToken, this.messageContents);
        return Promise.resolve(res);
      } catch(e) {
        return Promise.reject(e);
      }

    } else if (this.userId !== undefined){
      try{
        const res = await super.pushMessage(this.userId, this.messageContents);
        return Promise.resolve(res);
      } catch(e) {
        return Promise.reject(e);
      }
    } else {
      return Promise.reject("You need replyToken or userId to send.")
    }
  }

  async getUserName(){
    if (this.userId == undefined){
      return Promise.reject("UserId not set.")
    }
    try{
      const res = await super.getProfile(this.userId);
      return Promise.resolve(res.displayName);
    } catch(e) {
      return Promise.reject(e);
    }
  }

  async linkRichMenu(richMenuId){
    if (this.userId == undefined){
      return Promise.reject("UserId not set.")
    }
    try{
      const res = await super.linkRichMenuToUser(this.userId, richMenuId);
      return Promise.resolve(res);
    } catch(e) {
      return Promise.reject(e);
    }
  }
}

module.exports = {
  LineBotController: LineBotController,
  LineBotMiddleware: lineBotSDK.middleware
};