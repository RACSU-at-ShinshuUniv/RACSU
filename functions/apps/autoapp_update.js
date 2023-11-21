const get_latest_task = require("../file_modules/get_latest_task");
const today = new Date;

const add_batch = async(db, batch, {user_id="", account_data={}, class_name_dic={}, reg_tasks={}}) => {
  const new_task_data = await get_latest_task({
    user_id: user_id,
    account_data: account_data,
    class_name_dic: class_name_dic
  })

  // データベースにのみ存在し、displayがtrueの課題の課題をマージ
  // displayがfalseで、ealps上からも削除された課題はここでなくなる
  Object.keys(reg_tasks).forEach((key) => {
    if (!(key in new_task_data) && reg_tasks[key].display){
      new_task_data[key] = reg_tasks[key];
    }
  })

  // すでにデータベースに登録済みの課題は、登録されているdisplayとfinishの値をもってくる
  // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
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

    // 期限より3日以上過ぎた課題は非表示にする
    if (((new_task_data[key].task_limit.toDate() - today) / 86400000) < -3){
      new_task_data[key].display = false;
    }

    new_task_data[key].display = true;
  });

  console.log(`バッチ処理追加 (userID:${user_id})`)
  batch.set(db.collection("tasks").doc(user_id), new_task_data);
}


module.exports = async(db, {all_user_data, all_reg_tasks, all_user_id, class_name_dic}) => {
  const batch = db.batch()
  const prev_length = Object.keys(class_name_dic).length;

  const is_dev_mode = JSON.parse(process.env.DEBUG_FLAG);
  if (!is_dev_mode){
    console.log(`課題更新処理開始（総タスク：${all_user_id.length}件 最大並列ノード数：${process.env.MAX_ASYNC_NODES}）`);
  } else if (is_dev_mode){
    console.log(`【デバックモード】課題更新処理開始（総タスク：${all_user_id.length}件 最大並列ノード数：${process.env.MAX_ASYNC_NODES}）`);
    // 以下、デバック処理
    // return Promise.resolve();

  } else {
    return Promise.reject("環境変数が見つかりません。")
  }



  // 一度の非同期処理の最大ノード数をMAX_ASYNC_NODESに制限しながら更新を行う
  // promisesのリストに、再帰処理で連続させた非同期処理をMAX_ASYNC_NODESの数追加してPromise.allする
  let update_count = 0, update_error = 0, index_global = 0, promises = [];

  for (let i = 0; i < process.env.MAX_ASYNC_NODES; i++) {
    let p = new Promise((resolve) => {

      (async function loop(index) {
        if (index < all_user_id.length) {
            console.log(`${index}番タスク -> スロット${i}で実行開始 (userID:${all_user_id[index]})`);
            try{
              await add_batch(db, batch, {
                user_id: all_user_id[index],
                account_data: all_user_data[all_user_id[index]],
                class_name_dic: class_name_dic,
                reg_tasks: all_reg_tasks[all_user_id[index]]
              })

              console.log(`${index}番タスク終了`);
              update_count++;

            } catch(e) {
              console.error(`${index}番タスクエラー発生`, e);
              update_error++;
            }

            loop(index_global++);
            return;
        }
        resolve();
      })(index_global++);
    });

    promises.push(p);
  };

  // すべてのユーザーの更新完了まで待機
  await Promise.all(promises);
  console.log(`課題更新処理終了（総タスク：${all_user_id.length}件 完了：${update_count}件 エラー：${update_error}件）`);

  console.log("バッチ処理開始");
  batch.commit()
  .then((res) => {
    console.log("バッチ処理完了");
  }).catch((e) => {
    console.log("バッチ処理でエラー発生", e);
  });

  // 全ユーザーの課題更新終了後、class_name_dicに変更があればデータベースを更新
  if (prev_length !== Object.keys(class_name_dic).length){
    db.collection("overall").doc("classes").set(class_name_dic).then(() => {
      console.log("update class_name_dic");
    });
  }

  return Promise.resolve({result: "ok", status: "all task updated"});
}