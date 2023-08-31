module.exports = async(db, {user_id="", account_data={}}) => {
  // ical取得先URLを取得
  const term = new Date();
  term.setMonth(term.getMonth()-3);
  const url_g = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export_execute.php?userid=${account_data.moodle_general_id}&authtoken=${account_data.moodle_general_token}&preset_what=all&preset_time=recentupcoming`;
  const url_s = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${account_data.student_id.match(/[LEJSMTAF]/i)}/calendar/export_execute.php?userid=${account_data.moodle_specific_id}&authtoken=${account_data.moodle_specific_token}&preset_what=all&preset_time=recentupcoming`;


  // icalデータを取得
  const ical = require("../file_modules/ical_fetch")
  const ical_data_general = await ical.get_contents({
    url: url_g
  })
  const ical_data_specific = await ical.get_contents({
    url: url_s
  })

  // icalデータをFirestore保存形式に変換
  const data_formatter = require("../file_modules/data_formatter");
  const task_data_general = await data_formatter.ical_to_json({
    class_name_dic: (await db.collection("overall").doc("classes").get()).data(),
    ical_data: ical_data_general
  })
  const task_data_specific = await data_formatter.ical_to_json({
    ical_data: ical_data_specific
  })

  // Firestore保存形式をflexデータに変換
  const flex_data = data_formatter.json_to_flex({
    tasks: {...task_data_general, ...task_data_specific}
  });

  if (Object.keys({...task_data_general, ...task_data_specific}).length == 0){
    return Promise.reject()

  } else {
    // Firestoreに保存
    db.collection("tasks").doc(user_id).update({...task_data_general, ...task_data_specific});
    return Promise.resolve(flex_data);
  }
}