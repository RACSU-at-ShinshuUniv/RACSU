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

    if (!isAutoAppDevMode){
      try{
        await mailClient.taskNotify(htmlTask).sendTo(`${linkedUserData[userId].studentId}@shinshu-u.ac.jp`)
        console.log(`メール送信（to: ${`${linkedUserData[userId].studentId}@shinshu-u.ac.jp`}, title: ${htmlTask.title}）`);
        sendCount++;

      }catch(e){
        console.log(`${linkedUserData[userId].studentId}@shinshu-u.ac.jp`, e);
        errorCount++;
      }

    } else {
      console.log(`${userId} 環境変数によりメール送信はスキップされました。（to: ${linkedUserData[userId].studentId}@shinshu-u.ac.jp title: ${htmlTask.title}）`);
    }
  };

  console.log(`課題通知処理完了（送信候補：${notifyUserIds.length}件 実送信：${sendCount}件 エラー：${errorCount}件）`);
  console.timeEnd("総送信処理時間");
  return Promise.resolve({status: "done"});
}