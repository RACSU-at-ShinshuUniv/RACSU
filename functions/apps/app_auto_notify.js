module.exports = async(db) => {
  const app_update_task = require("./app_update_task")
  const mail_sender = require("../file_modules/mail_sender");
  const { json_to_mail_param } = require("../file_modules/data_formatter");
  const class_name_dic = (await db.collection("overall").doc("classes").get()).data();
  const prev_length = Object.keys(class_name_dic).length;
  let user_data = {};

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
  console.log(`課題更新処理開始（総タスク数：${user_ids.length}件 最大並列ノード数：${process.env.MAX_ASYNC_NODES}）`);
  let index_global = 0, promises = [];
  for (let i = 0; i < process.env.MAX_ASYNC_NODES; i++) {
    let p = new Promise((resolve) => {

      (async function loop(index) {
        if (index < user_ids.length) {
            console.log(`${index}番タスク -> スロット${i}で実行開始 (userID:${user_ids[index]})`);
            try{
              const res = await app_update_task(db, {
                user_id: user_ids[index],
                account_data: user_data[user_ids[index]],
                class_name_dic: class_name_dic,
                need_flex_data: false
              })

              const mail_param = json_to_mail_param({
                tasks: res.data
              });

              if (mail_param.do_notify){
                await mail_sender({
                  method: "notify",
                  address: `${user_data[user_ids[index]].student_id}@shinshu-u.ac.jp`,
                  data: mail_param
                })
                console.log(`${index}番タスク終了 メール送信：送信（${mail_param.title}）`)

              } else {
                console.log(`${index}番タスク終了 メール送信：なし`)
              }

            } catch(e) {
              console.log(`${index}番タスクエラー発生`, e);
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

  // 全ユーザーの課題更新終了後、class_name_dicに変更があればデータベースを更新
  if (prev_length !== Object.keys(class_name_dic).length){
    db.collection("overall").doc("classes").set(class_name_dic).then(() => {
      console.log("update class_name_dic");
    });
  }

  return Promise.resolve({result: "ok", status: "all task finished"});
}