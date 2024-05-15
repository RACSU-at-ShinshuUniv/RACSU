const { IcalTask } = require("../lib/DataFormatter");
const IcalClient = require("../lib/IcalClient");
const today = new Date;

const addBatch = async(db, batch, {userId="", userData={}, classNameDict={}, registeredTask={}}) => {
  // 課題取得先URL作成
  const thisTerm = new Date();
  thisTerm.setMonth(thisTerm.getMonth()-3);
  const moodleURL_g = `https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/g/calendar/export_execute.php?userid=${userData.moodleGeneralId}&authtoken=${userData.moodleGeneralToken}&preset_what=all&preset_time=recentupcoming`;
  const moodleURL_s = `https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/${userData.studentId.match(/[LEJSMTAF]/i)}/calendar/export_execute.php?userid=${userData.moodleSpecificId}&authtoken=${userData.moodleSpecificToken}&preset_what=all&preset_time=recentupcoming`;

  // ical取得クライアント作成
  const icalClient = new IcalClient(moodleURL_g, moodleURL_s);

  // 最新データを取得し、jsonデータに変換
  const icalTask = new IcalTask(await icalClient.getLatestData())
  const latestJsonTask = (await icalTask.toJson(classNameDict)).get();

  // データベースにのみ存在し、displayがtrueの課題の課題をマージ
  // displayがfalseで、ealps上からも削除された課題はここでなくなる
  Object.keys(registeredTask).forEach((key) => {
    if (!(key in latestJsonTask) && registeredTask[key].display){
      latestJsonTask[key] = registeredTask[key];
    }
  })

  // すでにデータベースに登録済みの課題は、登録されているdisplayとfinishの値をもってくる
  // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
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

    // 期限より3日以上過ぎた課題は非表示にする
    if (((latestJsonTask[key].taskLimit.toDate() - today) / 86400000) < -3){
      latestJsonTask[key].display = false;
    }
  });

  console.log(`バッチ処理追加 (userID:${userId})`)
  batch.set(db.collection("tasks").doc(userId), latestJsonTask);
}


module.exports = async(db, {linkedUserData, notifyUserIds}) => {
  const linkedUserIds = Object.keys(linkedUserData);
  const batch = db.batch();
  const classNameDict = (await db.collection("overall").doc("classes").get()).data();
  classNameDict.initLength = Object.keys(classNameDict).length;

  const isAutoAppDevMode = JSON.parse(process.env.AUTOAPP_DEBUG_FLAG);
  if (!isAutoAppDevMode){
    console.log(`課題更新処理開始（総タスク：${linkedUserIds.length}件 最大並列ノード数：${process.env.MAX_ASYNC_NODES}）`);
  } else if (isAutoAppDevMode){
    console.log(`【デバックモード】課題更新処理開始（総タスク：${linkedUserIds.length}件 最大並列ノード数：${process.env.MAX_ASYNC_NODES}）`);
    // 以下、デバック処理
    // return Promise.resolve();

  } else {
    return Promise.reject("環境変数が見つかりません。")
  }



  // 一度の非同期処理の最大ノード数をMAX_ASYNC_NODESに制限しながら更新を行う
  // promisesのリストに、再帰処理で連続させた非同期処理をMAX_ASYNC_NODESの数追加してPromise.allする
  let updateCount = 0, errorCount = 0, globalIndex = 0
  const promises = [];

  for (let i = 0; i < process.env.MAX_ASYNC_NODES; i++) {
    let p = new Promise((resolve) => {

      (async function loop(index) {
        if (index < linkedUserIds.length) {
            console.log(`${index}番タスク -> スロット${i}で実行開始 (userID:${linkedUserIds[index]})`);
            try{
              await addBatch(db, batch, {
                userId: linkedUserIds[index],
                userData: linkedUserData[linkedUserIds[index]],
                classNameDict: classNameDict,
                registeredTask: linkedUserData[linkedUserIds[index]].registeredTask
              })

              console.log(`${index}番タスク終了`);
              updateCount++;

            } catch(e) {
              console.error(`${index}番タスクエラー発生`, e);
              errorCount++;
            }

            loop(globalIndex++);
            return;
        }
        resolve();
      })(globalIndex++);
    });

    promises.push(p);
  };

  // すべてのユーザーの更新完了まで待機
  await Promise.all(promises);
  console.log(`課題更新処理終了（総タスク：${linkedUserIds.length}件 完了：${updateCount}件 エラー：${errorCount}件）`);

  console.log("バッチ処理開始");
  batch.commit()
  .then((res) => {
    console.log("バッチ処理完了");
  }).catch((e) => {
    console.log("バッチ処理でエラー発生", e);
  });

  // 全ユーザーの課題更新終了後、classNameDictに変更があればデータベースを更新
  if (classNameDict.initLength !== Object.keys(classNameDict).length-1){
    delete classNameDict.initLength;
    db.collection("overall").doc("classes").set(classNameDict).then(() => {
      console.log("update classNameDict");
    });
  }

  return Promise.resolve({status: "done"});
}