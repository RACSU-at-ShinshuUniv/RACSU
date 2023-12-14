require("date-utils")

const convert_limit = (message) => {
  if (message.match(/期限日：「(\d{4}\/\d{1,2}\/\d{1,2})」/) !== null) {
    return message.match(/期限日：「(\d{4}\/\d{1,2}\/\d{1,2})」/)[1];

  } else {
    const limit = new Date();
    try{
      const day = limit.getDay();
      const limit_text = message.match(/期限日：「(.+)」/)[1];
      if (limit_text.includes("今週")) {
        limit.setDate(limit.getDate() - day + (day == 0 ? -6:1));
      } else if (limit_text.includes("翌週")) {
        limit.setDate(limit.getDate() - day + (day == 0 ? -6:1) + 7);
      } else if (limit_text.includes("翌々週")) {
        limit.setDate(limit.getDate() - day + (day == 0 ? -6:1) + 14);
      } else {
        return null
      }

      if (limit_text.includes("月曜")) {
      } else if (limit_text.includes("火曜")) {
        limit.setDate(limit.getDate() + 1);
      } else if (limit_text.includes("水曜")) {
        limit.setDate(limit.getDate() + 2);
      } else if (limit_text.includes("木曜")) {
        limit.setDate(limit.getDate() + 3);
      } else if (limit_text.includes("金曜")) {
        limit.setDate(limit.getDate() + 4);
      } else if (limit_text.includes("土曜")) {
        limit.setDate(limit.getDate() + 5);
      } else if (limit_text.includes("日曜")) {
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

module.exports = async(db, {user_id="", message=""}) => {
  const today = new Date();

  const class_name = (message.match(/講義名：「(.+)」/) !== null)
    ? message.match(/講義名：「(.+)」/)[1]
    : null;
  const task_name = (message.match(/課題名：「(.+)」/) !== null)
    ? message.match(/課題名：「(.+)」/)[1]
    : null;
  const task_limit_day = convert_limit(message);
  const task_limit_time = (message.match(/期限時間：「(\d{1,2}:\d{1,2})」/) !== null)
    ? message.match(/期限時間：「(\d{1,2}:\d{1,2})」/)[1]
    : null;


  if (class_name == null){
    return Promise.resolve({result: "error", msg: "講義名が認識できません。"});
  }
  if (task_name == null){
    return Promise.resolve({result: "error", msg: "課題名が認識できません。"});
  }
  if (task_limit_day == null){
    return Promise.resolve({result: "error", msg: "期限日が認識できません。"});
  }
  if (task_limit_time == null){
    return Promise.resolve({result: "error", msg: "期限時間が認識できません。"});
  }


  const task_limit = new Date(`${task_limit_day} ${task_limit_time}`);

  if (task_limit < today){
    return Promise.resolve({result: "error", msg: "課題の締切が過去の日付です。"});
  }

  const task_data = {
    class_name: class_name,
    task_name: task_name,
    task_limit: task_limit.toFormat("YYYY/MM/DD HH24:MI")
  }

  return Promise.resolve({result: "ok", data: task_data});
}