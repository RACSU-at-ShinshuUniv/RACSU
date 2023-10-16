module.exports = async(db) => {
  const app_update_task = require("./app_update_task")
  const class_name_dic = (await db.collection("overall").doc("classes").get()).data();
  const prev_length = Object.keys(class_name_dic).length;
  const user_data = {};

  // 全ユーザーデータ取得
  (await db.collection("users").get()).forEach(doc => {
    const data = doc.data();
    if (data.account_status == "linked"){
      user_data[doc.id] = data;
    }
  });
  const user_ids = Object.keys(user_data);


  // 一度の非同期処理の最大ノード数をMAX_ASYNC_NODESに制限しながら更新を行う
  // promisesのリストに、再帰処理で連続させた非同期処理をMAX_ASYNC_NODESの数追加してPromise.allする
  console.log(`課題更新処理開始（総タスク：${user_ids.length}件 最大並列ノード数：${process.env.MAX_ASYNC_NODES}）`);
  let update_count = 0, update_error = 0;
  let index_global = 0, promises = [];
  for (let i = 0; i < process.env.MAX_ASYNC_NODES; i++) {
    let p = new Promise((resolve) => {

      (async function loop(index) {
        if (index < user_ids.length) {
            console.log(`${index}番タスク -> スロット${i}で実行開始 (userID:${user_ids[index]})`);
            try{
              await app_update_task(db, {
                user_id: user_ids[index],
                account_data: user_data[user_ids[index]],
                class_name_dic: class_name_dic,
                need_flex_data: false
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
  console.log(`課題更新処理終了（総タスク：${user_ids.length}件 完了：${update_count}件 エラー：${update_error}件）`);

  // 全ユーザーの課題更新終了後、class_name_dicに変更があればデータベースを更新
  if (prev_length !== Object.keys(class_name_dic).length){
    db.collection("overall").doc("classes").set(class_name_dic).then(() => {
      console.log("update class_name_dic");
    });
  }

  return Promise.resolve({result: "ok", status: "all task updated"});
}