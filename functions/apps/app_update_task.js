module.exports = async(db, {user_id="", account_data={}, class_name_dic={}}) => {
  const today = new Date();

  // 取得した課題データとすでにデータベースに登録済みの課題データのすり合わせをする
  const get_latest_task = require("../file_modules/get_latest_task");
  const new_task_data = await get_latest_task({
    user_id: user_id,
    account_data: account_data,
    class_name_dic: class_name_dic
  })

  try{
    await db.runTransaction(async(t) => {
      const reg_tasks = (await db.collection("tasks").doc(user_id).get()).data();

      // データベースにのみ存在し、displayがtrueの課題の課題をマージ
      // displayがfalseで、ealps上からも削除された課題はここでなくなる
      Object.keys(reg_tasks).forEach((key) => {
        if (!(key in new_task_data) && reg_tasks[key].display){
          new_task_data[key] = reg_tasks[key];
        }
      })


      Object.keys(new_task_data).forEach((key) => {
        // すでにデータベースに登録済みの課題は、登録されているdisplayとfinishの値をもってくる
        if (key in reg_tasks){
          new_task_data[key].finish = reg_tasks[key].finish;
          new_task_data[key].display = reg_tasks[key].display;
        }

        // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
        if ((new_task_data[key].task_limit.toDate() < today) && new_task_data[key].finish){
          new_task_data[key].display = false;
        }
      });

      t.set(db.collection("tasks").doc(user_id), new_task_data);
    });


    // Firestore保存形式をflexデータに変換
    const { json_to_flex } = require("../file_modules/data_formatter");
    const flex_data = json_to_flex({
      tasks: new_task_data
    });

    if (Object.keys(new_task_data).length == 0){
      return Promise.resolve({result: "no task"})
    } else {
      return Promise.resolve({result: "ok", data: flex_data});
    }

  } catch(e) {
    console.log("課題手動更新でエラー発生", e);
    return Promise.reject("課題情報のデータベース保存に失敗しました。\nこの問題が複数回発生する場合は、メッセージによりお知らせください。");
  }
}