module.exports = async(db) => {
  const mail_sender = require("../file_modules/mail_sender");
  const { json_to_mail_param } = require("../file_modules/data_formatter");
  const user_data = {}, user_task = {};

  // 全ユーザーデータ取得
  (await db.collection("tasks").get()).forEach(doc => {
    user_task[doc.id] = doc.data();
  });
  (await db.collection("users").get()).forEach(doc => {
    user_data[doc.id] = doc.data();
  });
  const user_ids = Object.keys(user_task);

  console.log(`課題通知処理開始（送信候補：${user_ids.length}件）`);
  let send_count = 0, send_error = 0;

  for (const user_id of user_ids){
    const mail_param = json_to_mail_param({
      tasks: user_task[user_id]
    });

    if (mail_param.do_notify){
      try{
        await mail_sender({
          method: "notify",
          address: `${user_data[user_id].student_id}@shinshu-u.ac.jp`,
          // address: `21t2168a@shinshu-u.ac.jp`,
          data: mail_param
        })
        console.log(`${user_id} メール送信（${mail_param.title}）`);
        send_count++;

      } catch(e) {
        console.log(`${user_id} メール送信エラー`, e);
        send_error++;
      }


    } else {
      console.log(`${user_id} メール未送信`);
    }
  };

  console.log(`課題通知処理完了（送信候補：${user_ids.length}件 実送信：${send_count}件 エラー：${send_error}件）`);
  return Promise.resolve({result: "ok", status: "all mail sended"});
}