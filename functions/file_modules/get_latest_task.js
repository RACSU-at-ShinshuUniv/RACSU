module.exports = async({user_id="", account_data={}, class_name_dic={}}) => {
  // ユーザーデータからical取得先URLに変換
  const term = new Date();
  term.setMonth(term.getMonth()-3);
  const url_g = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export_execute.php?userid=${account_data.moodle_general_id}&authtoken=${account_data.moodle_general_token}&preset_what=all&preset_time=recentupcoming`;
  const url_s = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${account_data.student_id.match(/[LEJSMTAF]/i)}/calendar/export_execute.php?userid=${account_data.moodle_specific_id}&authtoken=${account_data.moodle_specific_token}&preset_what=all&preset_time=recentupcoming`;

  // icalデータを取得
  const { get_contents } = require("../file_modules/ical_fetch");
  const ical_data_general = await get_contents({
    url: url_g
  });
  const ical_data_specific = await get_contents({
    url: url_s
  });

  // icalデータをFirestore保存形式に変換
  // class_name_dicは内部での変更あり
  const { ical_to_json } = require("../file_modules/data_formatter");
  const res_g = await ical_to_json({
    class_name_dic: class_name_dic,
    ical_data: ical_data_general,
    dev_msg: `g/${user_id}`
  });

  const res_s = await ical_to_json({
    class_name_dic: class_name_dic,
    ical_data: ical_data_specific,
    dev_msg: `s/${user_id}`
  });

  return Promise.resolve({...res_g, ...res_s});
}