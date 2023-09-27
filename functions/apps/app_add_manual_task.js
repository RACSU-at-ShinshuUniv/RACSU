require("date-utils")
module.exports = async(db, {user_id="", message=""}) => {
  const class_name = (message.match(/講義名：「(.+)」/) !== null)
    ? message.match(/講義名：「(.+)」/)[1]
    : null;
  const task_name = (message.match(/課題名：「(.+)」/) !== null)
    ? message.match(/課題名：「(.+)」/)[1]
    : null;
  const task_limit_day = (message.match(/期限日：「(\d{4}\/\d{1,2}\/\d{1,2})」/) !== null)
    ? message.match(/期限日：「(\d{4}\/\d{1,2}\/\d{1,2})」/)[1]
    : null;
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
  const today = new Date();
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