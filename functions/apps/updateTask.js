module.exports = async(db, {userId="", userData={}}) => {
  const today = new Date();
  const classNameDict = (await db.collection("overall").doc("classes").get()).data();
  classNameDict.initLength = Object.keys(classNameDict).length;

  // 課題取得先URL作成
  const thisTerm = new Date();
  thisTerm.setMonth(thisTerm.getMonth()-3);
  const moodleURL_g = `https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/g/calendar/export_execute.php?userid=${userData.moodleGeneralId}&authtoken=${userData.moodleGeneralToken}&preset_what=all&preset_time=recentupcoming`;
  const moodleURL_s = `https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/${userData.studentId.match(/[LEJSMTAF]/i)}/calendar/export_execute.php?userid=${userData.moodleSpecificId}&authtoken=${userData.moodleSpecificToken}&preset_what=all&preset_time=recentupcoming`;

  // ical取得クライアント作成
  const IcalClient = require("../lib/IcalClient");
  const icalClient = new IcalClient(moodleURL_g, moodleURL_s);

  // 最新データを取得し、jsonデータに変換
  const { IcalTask } = require("../lib/DataFormatter");
  const icalTask = new IcalTask(await icalClient.getLatestData())
  const latestJsonTask = (await icalTask.toJson(classNameDict)).get();

  try{
    await db.runTransaction(async(t) => {
      const registeredTask = (await db.collection("tasks").doc(userId).get()).data();

      // データベースにのみ存在し、displayがtrueの課題の課題をマージ
      // displayがfalseで、ealps上からも削除された課題はここでなくなる
      Object.keys(registeredTask).forEach((key) => {
        if (!(key in latestJsonTask) && registeredTask[key].display){
          latestJsonTask[key] = registeredTask[key];
        }
      })

      Object.keys(latestJsonTask).forEach((key) => {
        // すでにデータベースに登録済みの課題は、登録されているdisplayとfinishの値をもってくる
        if (key in registeredTask){
          latestJsonTask[key].finish = registeredTask[key].finish;
          latestJsonTask[key].display = registeredTask[key].display;
        }

        // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
        if ((latestJsonTask[key].taskLimit.toDate() < today) && latestJsonTask[key].finish){
          latestJsonTask[key].display = false;
        }
      });

      t.set(db.collection("tasks").doc(userId), latestJsonTask);
    });

    if (classNameDict.initLength !== Object.keys(classNameDict).length-1){
      delete classNameDict.initLength;
      db.collection("overall").doc("classes").set(classNameDict).then(() => {
        console.log("update classNameDict");
      });
    }

    // Firestore保存形式をflexデータに変換
    const { JsonTask } = require("../lib/DataFormatter");
    const jsonTask = new JsonTask(latestJsonTask);

    if (Object.keys(latestJsonTask).length == 0){
      return Promise.resolve({status: "taskNotExist", message: {contents: "現在取得できる課題はありません。"}});
    } else {
      return Promise.resolve({status: "done", message: jsonTask.toFlex().get()});
    }

  } catch(e) {
    console.log("課題手動更新でエラー発生", e);
    return Promise.reject("課題情報のデータベース保存に失敗しました。");
  }
}