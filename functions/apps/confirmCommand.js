module.exports = async(db, {userId="", message=""}) => {
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
      const jsonTask = (await db.collection("tasks").doc(userId).get()).data();
      if (!(key in jsonTask)){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      // データベースへのfinish=true書き込みは送信と同時に非同期で行う
      db.collection("tasks").doc(userId).update({[`${key}.finish`]: true})
      jsonTask[key].finish = true;

      // メッセージに変換
      const { JsonTask } = require("../lib/DataFormatter");
      const flexTask = (new JsonTask(jsonTask)).toFlex().get();

      return Promise.resolve({status: "done", message: flexTask, cmd: "finish"});
    }


    case "redo": {
      // finishのときとほぼ同一動作
      const key = (message.match(/cmd@redo\?key=(\d+)/) !== null)
        ? message.match(/cmd@redo\?key=(\d+)/)[1]
        : null;
      if (key == null){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      const jsonTask = (await db.collection("tasks").doc(userId).get()).data();
      if (!(key in jsonTask)){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      db.collection("tasks").doc(userId).update({[`${key}.finish`]: false})
      jsonTask[key].finish = false;

      const { JsonTask } = require("../lib/DataFormatter");
      const flexTask = (new JsonTask(jsonTask)).toFlex().get();

      return Promise.resolve({status: "done", message: flexTask, cmd: "redo"});
    }

    case "add": {
      const { Timestamp } = require('@google-cloud/firestore');

      try{
        const confirmedTask = message.match(/cmd@add\?cn=(?<className>.+)&tn=(?<taskName>.+)&tl=(?<taskLimit>\d{4}\/\d{2}\/\d{2}-\d{2}:\d{2})/).groups;
        const newTaskData = {
          className: confirmedTask.className,
          taskName: confirmedTask.taskName,
          taskLimit: Timestamp.fromDate(new Date(confirmedTask.taskLimit)),
          finish: false,
          display: true
        }
        let key = "990";
        for (let i=0; i<4; i++){
          key += Math.floor(Math.random()*10).toString();
        }

        try{
          const flexTask = await db.runTransaction(async(t) => {
            const registeredTask = (await db.collection("tasks").doc(userId).get()).data();
            registeredTask[key] = newTaskData;
            t.set(db.collection("tasks").doc(userId), registeredTask);

            const { JsonTask } = require("../lib/DataFormatter");
            return (new JsonTask(registeredTask)).toFlex().get();
          });

          return Promise.resolve({status: "done", message: flexTask, cmd: "add"});

        } catch(e) {
          console.log("課題手動追加でエラー発生", e);
          return Promise.reject("課題情報のデータベース保存に失敗しました。\nこの問題が複数回発生する場合は、メッセージによりお知らせください。");
        }

      } catch(e) {
        console.error(e);
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }
    }


    case "delete": {
      const target = (message.match(/cmd@delete\?target=(.+)/) !== null)
        ? message.match(/cmd@delete\?target=(.+)/)[1]
        : null;
      if (target == null || !["past", "finish"].includes(target)){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      const flexTask = await db.runTransaction(async(t) => {
        const registeredTask = (await db.collection("tasks").doc(userId).get()).data();

        if (target == "past"){
          const today = new Date();
          Object.keys(registeredTask).forEach((key) => {
            // 過去の課題のdisplayをfalseに設定
            if ((registeredTask[key].taskLimit.toDate() < today)){
              registeredTask[key].display = false;
            }
          });
        } else if (target == "finish"){
          Object.keys(registeredTask).forEach((key) => {
            // 完了済みの課題のdisplayをfalseに設定
            if (registeredTask[key].finish){
              registeredTask[key].display = false;
            }
          });
        }
        t.set(db.collection("tasks").doc(userId), registeredTask);

        const { JsonTask } = require("../lib/DataFormatter");
        return (new JsonTask(registeredTask)).toFlex().get();
      });
      return Promise.resolve({status: "done", message: flexTask, cmd: "delete"});
    }

    case "config": {
      const target = (message.match(/cmd@config\?(.+)=.+/) !== null)
        ? message.match(/cmd@config\?(.+)=.+/)[1]
        : null;
      const timeChangeTo = (message.match(/cmd@config\?.+=(.+)/) !== null)
        ? message.match(/cmd@config\?.+=(.+)/)[1]
        : null;
      if (target == null || timeChangeTo == null){
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }

      if (target == "notify"){
        if (timeChangeTo == "9:00"){
          db.collection("users").doc(userId).update({"notify": true});
          return Promise.resolve({status: "done", message: {contents: "「9:00に通知」に変更しました。"}, cmd: "config/notify"});
        } else if (timeChangeTo == "none"){
          db.collection("users").doc(userId).update({"notify": false});
          return Promise.resolve({status: "done", message: {contents: "「通知しない」に変更しました。"}, cmd: "config/notify"});
        } else {
          return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
        }
      } else {
        return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。");
      }
    }


    default: {
      return Promise.reject("無効なコマンドです。正しいパラメータを送信してください。")
    }
  }
}