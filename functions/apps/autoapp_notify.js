module.exports = async({all_user_data, all_reg_tasks, all_user_id}) => {
  const mail_sender = require("../file_modules/mail_sender");
  const { json_to_mail_param } = require("../file_modules/data_formatter");

  const is_dev_mode = JSON.parse(process.env.DEBUG_FLAG);
  if (!is_dev_mode){
    console.log(`課題通知：送信処理開始（送信候補：${all_user_id.length}件）`);
  } else if (is_dev_mode){
    console.log(`【デバックモード】課題通知：送信処理開始（送信候補：${all_user_id.length}件）`);
    // 以下、デバック処理

  } else {
    return Promise.reject("環境変数が見つかりません。")
  }


  console.time("総送信処理時間");
  let send_count = 0, send_error = 0;

  for (const user_id of all_user_id){
    const mail_param = json_to_mail_param({
      tasks: all_reg_tasks[user_id]
    });

    if (mail_param.do_notify){
      try{
        let address = "";
        if (is_dev_mode){
          address = "racsu.shinshu.univ@gmail.com"
        } else {
          address = `${all_user_data[user_id].student_id}@shinshu-u.ac.jp`
        }

        if (process.env.GCLOUD_PROJECT == "racsu-shindai"){
          await mail_sender({
            method: "notify",
            address: address,
            data: mail_param
          })
          console.log(`${user_id} メール送信（to: ${address} title: ${mail_param.title}）`);
          send_count++;

        } else if (process.env.GCLOUD_PROJECT == "racsu-develop"){
          console.log(`${user_id} 開発環境のため、メール送信はスキップされました。（to: ${address} title: ${mail_param.title}）`);
        }

      } catch(e) {
        console.log(`${user_id} メール送信エラー`, e);
        send_error++;
      }


    } else {
      console.log(`${user_id} メール未送信`);
    }
  };

  console.log(`課題通知処理完了（送信候補：${all_user_id.length}件 実送信：${send_count}件 エラー：${send_error}件）`);
  console.timeEnd("総送信処理時間");
  return Promise.resolve({result: "ok", status: "all mail sended"});
}