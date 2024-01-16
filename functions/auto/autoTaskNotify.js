module.exports = async({linkedUserData, notifyUserIds}) => {
  const MailClient = require("../lib/MailClient");
  const mailAccount = require("../data/keys/MailAccount.json")
  const mailClient = new MailClient(mailAccount);
  const { JsonTask } = require("../lib/DataFormatter");

  const isAutoAppDevMode = JSON.parse(process.env.AUTOAPP_DEBUG_FLAG);
  if (!isAutoAppDevMode){
    console.log(`課題通知：送信処理開始（送信候補：${notifyUserIds.length}件）`);
  } else if (isAutoAppDevMode){
    console.log(`【デバックモード】課題通知：送信処理開始（送信候補：${notifyUserIds.length}件）`);
    // 以下、デバック処理

  } else {
    return Promise.reject("環境変数が見つかりません。")
  }


  console.time("総送信処理時間");
  let sendCount = 0, errorCount = 0;

  for (const userId of notifyUserIds){
    const htmlTask = (new JsonTask(linkedUserData[userId].registeredTask)).toHtml().get();

    if (!htmlTask.doNotify){
      console.log(`${userId} メール未送信`);
      continue;
    }

    const activeAddress = (() => {
      if (isAutoAppDevMode){
        return "racsu.shinshu.univ@gmail.com";
      } else {
        return `${linkedUserData[userId].studentId}@shinshu-u.ac.jp`;
      }
    })();

    if (process.env.GCLOUD_PROJECT == "racsu-shindai"){
      try{
        await mailClient.taskNotify(htmlTask).sendTo(activeAddress)
        console.log(`メール送信完了（to: ${activeAddress}, title: ${htmlTask.title}）`);
        sendCount++;

      }catch(e){
        console.log(activeAddress, e);
        errorCount++;
      }

    } else if (process.env.GCLOUD_PROJECT == "racsu-develop"){
      console.log(`${userId} メール送信はスキップされました。（to: ${activeAddress} title: ${htmlTask.title}）`);
    }
  };

  console.log(`課題通知処理完了（送信候補：${notifyUserIds.length}件 実送信：${sendCount}件 エラー：${errorCount}件）`);
  console.timeEnd("総送信処理時間");
  return Promise.resolve({status: "done"});
}