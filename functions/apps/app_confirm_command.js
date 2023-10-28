module.exports = async(db, {user_id="", message=""}) => {
  // 受信文字列にコマンド処理が含まれるか判定
  const method = (message.match(/cmd@(.+)\?/) !== null)
    ? message.match(/cmd@(.+)\?/)[1]
    : null;

  switch (method){
    // finishコマンド
    case "finish": {
      // 受信文字列から操作する課題のkeyを抜き出し
      const key = (message.match(/cmd@finish\?key=(\d+)/) !== null)
        ? message.match(/cmd@finish\?key=(\d+)/)[1]
        : null;
      if (key == null){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      // データベースにfinish=trueを書き込んでから送信すると時間がかかるため、
      // 直接データベースから取ってきた課題の値を書き換えたものを送る
      // データベースへのfinish=true書き込みは送信と同時に非同期で行う
      const doc_data = await db.collection("tasks").doc(user_id).get();

      if (!doc_data.exists){
        return Promise.reject(new Error("Data not found"));
      }
      if (!(key in doc_data.data())){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      const res = doc_data.data()
      res[key].finish = true;
      const data_formatter = require("../file_modules/data_formatter");
      const flex_data = data_formatter.json_to_flex({
        tasks: res
      });

      db.collection("tasks").doc(user_id).update({[`${key}.finish`]: true})
      return Promise.resolve({result: "ok", res_type: "task_list", data: flex_data});
    }


    case "redo": {
      // finishのときとほぼ同一動作
      const key = (message.match(/cmd@redo\?key=(\d+)/) !== null)
        ? message.match(/cmd@redo\?key=(\d+)/)[1]
        : null;
      if (key == null){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      const doc_data = await db.collection("tasks").doc(user_id).get();

      if (!doc_data.exists){
        return Promise.reject(new Error("Data not found"));
      }
      if (!(key in doc_data.data())){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      const res = doc_data.data()
      res[key].finish = false;
      const data_formatter = require("../file_modules/data_formatter");
      const flex_data = data_formatter.json_to_flex({
        tasks: res
      });

      db.collection("tasks").doc(user_id).update({[`${key}.finish`]: false})
      return Promise.resolve({result: "ok", res_type: "task_list", data: flex_data});
    }

    case "add": {
      const {Timestamp} = require('firebase-admin/firestore');
      try{
        const msg_task_data = message.match(/cmd@add\?cn=(?<class_name>.+)&tn=(?<task_name>.+)&tl=(?<task_limit>\d{4}\/\d{2}\/\d{2}-\d{2}:\d{2})/).groups;
        const new_task_data = {
          class_name: msg_task_data.class_name,
          task_name: msg_task_data.task_name,
          task_limit: Timestamp.fromDate(new Date(msg_task_data.task_limit)),
          finish: false,
          display: true
        }
        let key = "990";
        for (let i=0; i<4; i++){
          key += Math.floor(Math.random()*10).toString();
        }

        try{
          const flex_data = await db.runTransaction(async(t) => {
            const reg_tasks = (await db.collection("tasks").doc(user_id).get()).data();
            reg_tasks[key] = new_task_data;
            t.set(db.collection("tasks").doc(user_id), reg_tasks);

            const data_formatter = require("../file_modules/data_formatter");
            const flex_data = data_formatter.json_to_flex({
              tasks: reg_tasks
            });
            return flex_data;
          });

          return Promise.resolve({result: "ok", res_type: "task_list_added", data: flex_data});

        } catch(e) {
          console.log("課題手動追加でエラー発生", e);
          return Promise.reject("課題情報のデータベース保存に失敗しました。\nこの問題が複数回発生する場合は、メッセージによりお知らせください。");
        }

      } catch(e) {
        console.error(e);
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }
    }


    default: {
      return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。")
    }
  }
}