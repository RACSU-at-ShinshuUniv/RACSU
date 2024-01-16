require("date-utils")

const convertTaskLimit_day = (message) => {
  if (message.match(/期限日：「(\d{4}\/\d{1,2}\/\d{1,2})」/) !== null) {
    return message.match(/期限日：「(\d{4}\/\d{1,2}\/\d{1,2})」/)[1];

  } else {
    const limit = new Date();
    try{
      const day = limit.getDay();
      const limitText = message.match(/期限日：「(.+)」/)[1];
      if (limitText.includes("今週")) {
        limit.setDate(limit.getDate() - day + (day == 0 ? -6:1));
      } else if (limitText.includes("翌週")) {
        limit.setDate(limit.getDate() - day + (day == 0 ? -6:1) + 7);
      } else if (limitText.includes("翌々週")) {
        limit.setDate(limit.getDate() - day + (day == 0 ? -6:1) + 14);
      } else {
        return null
      }

      if (limitText.includes("月曜")) {
      } else if (limitText.includes("火曜")) {
        limit.setDate(limit.getDate() + 1);
      } else if (limitText.includes("水曜")) {
        limit.setDate(limit.getDate() + 2);
      } else if (limitText.includes("木曜")) {
        limit.setDate(limit.getDate() + 3);
      } else if (limitText.includes("金曜")) {
        limit.setDate(limit.getDate() + 4);
      } else if (limitText.includes("土曜")) {
        limit.setDate(limit.getDate() + 5);
      } else if (limitText.includes("日曜")) {
        limit.setDate(limit.getDate() - 1);
      } else {
        return null
      }

    } catch(e) {
      return null
    }

    return limit.toFormat("YYYY/MM/DD")

  }
}

module.exports = async({message=""}) => {
  const today = new Date();

  const className = (message.match(/講義名：「(.+)」/) !== null)
    ? message.match(/講義名：「(.+)」/)[1]
    : null;
  const taskName = (message.match(/課題名：「(.+)」/) !== null)
    ? message.match(/課題名：「(.+)」/)[1]
    : null;
  const taskLimit_day = convertTaskLimit_day(message);
  const taskLimit_time = (message.match(/期限時間：「(\d{1,2}:\d{1,2})」/) !== null)
    ? message.match(/期限時間：「(\d{1,2}:\d{1,2})」/)[1]
    : null;


  if (className == null){
    const flexContents = require("../data/flexMessage/retryAddManualTask.json");
    return Promise.resolve({
      status: "done",
      message: {
        contents: JSON.parse(JSON.stringify(flexContents)
        .replace("$1", "講義名が認識できません。")
        .replace("$2", message.replace(/\n/g, "\\n"))),
      altText: "内容を修正して再度送信してください。"
      }
    });
  }
  if (taskName == null){
    const flexContents = require("../data/flexMessage/retryAddManualTask.json");
    return Promise.resolve({
      status: "done",
      message: {
        contents: JSON.parse(JSON.stringify(flexContents)
        .replace("$1", "課題名が認識できません。")
        .replace("$2", message.replace(/\n/g, "\\n"))),
      altText: "内容を修正して再度送信してください。"
      }
    });
  }
  if (taskLimit_day == null){
    const flexContents = require("../data/flexMessage/retryAddManualTask.json");
    return Promise.resolve({
      status: "done",
      message: {
        contents: JSON.parse(JSON.stringify(flexContents)
        .replace("$1", "期限日が認識できません。")
        .replace("$2", message.replace(/\n/g, "\\n"))),
      altText: "内容を修正して再度送信してください。"
      }
    });
  }
  if (taskLimit_time == null){
    const flexContents = require("../data/flexMessage/retryAddManualTask.json");
    return Promise.resolve({
      status: "done",
      message: {
        contents: JSON.parse(JSON.stringify(flexContents)
        .replace("$1", "提出時間が認識できません。")
        .replace("$2", message.replace(/\n/g, "\\n"))),
      altText: "内容を修正して再度送信してください。"
      }
    });
  }


  const taskLimit = new Date(`${taskLimit_day} ${taskLimit_time}`);

  if (taskLimit < today){
    const flexContents = require("../data/flexMessage/retryAddManualTask.json");
    return Promise.resolve({
      status: "done",
      message: {
        contents: JSON.parse(JSON.stringify(flexContents)
        .replace("$1", "課題の締切が過去の日時です。")
        .replace("$2", message.replace(/\n/g, "\\n"))),
      altText: "内容を修正して再度送信してください。"
      }
    });
  }

  const flexContents = require("../data/flexMessage/addManualTask.json");
  return Promise.resolve({
    status: "done",
    message: {
      contents: JSON.parse(JSON.stringify(flexContents)
        .replace("$1", className)
        .replace("$2", taskName)
        .replace("$3", taskLimit.toFormat("YYYY/MM/DD HH24:MM"))
        .replace("$4", `cmd@add?cn=${className}&tn=${taskName}&tl=${taskLimit.toFormat("YYYY/MM/DD-HH24:MM")}`)
        .replace("$5", message.replace(/\n/g, "\\n"))),
      altText: "この内容で課題を追加しますか？"
    }
  });
}