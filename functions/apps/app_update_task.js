module.exports = async(db, {user_id="", account_data={}, class_name_dic={}, need_flex_data=true}) => {

  // ユーザーデータからical取得先URLに変換
  const today = new Date();
  const term = new Date();
  term.setMonth(term.getMonth()-3);
  const url_g = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export_execute.php?userid=${account_data.moodle_general_id}&authtoken=${account_data.moodle_general_token}&preset_what=all&preset_time=recentupcoming`;
  const url_s = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${account_data.student_id.match(/[LEJSMTAF]/i)}/calendar/export_execute.php?userid=${account_data.moodle_specific_id}&authtoken=${account_data.moodle_specific_token}&preset_what=all&preset_time=recentupcoming`;

  // icalデータを取得
  const ical = require("../file_modules/ical_fetch");
  const ical_data_general = await ical.get_contents({
    url: url_g
  });
  const ical_data_specific = await ical.get_contents({
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

  // 取得した課題データとすでにデータベースに登録済みの課題データのすり合わせをする
  const tasks_reg = (await db.collection("tasks").doc(user_id).get()).data();
  const new_task_data = {...res_g, ...res_s};

  // データベースにのみ存在し、displayがtrueの課題の課題をマージ
  // displayがfalseで、ealps上からも削除された課題はここでなくなる
  Object.keys(tasks_reg).forEach((key) => {
    if (!(key in new_task_data) && tasks_reg[key].display){
      new_task_data[key] = tasks_reg[key];
    }
  })

  // すでにデータベースに登録済みの課題は、登録されているdisplayとfinishの値をもってくる
  // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
  Object.keys(new_task_data).forEach((key) => {
    if (key in tasks_reg){
      new_task_data[key].finish = tasks_reg[key].finish;
      new_task_data[key].display = tasks_reg[key].display;
    }
    if ((new_task_data[key].task_limit.toDate() < today) && new_task_data[key].finish){
      new_task_data[key].display = false;
    }
  });

  // Firestoreに上書きで保存
  db.collection("tasks").doc(user_id).set(new_task_data);


  if (need_flex_data){
    // LINE送信用のFlexデータが必要な場合は、Firestore保存形式をflexデータに変換
    const { json_to_flex } = require("../file_modules/data_formatter");
    const flex_data = json_to_flex({
      tasks: new_task_data
    });

    if (Object.keys(new_task_data).length == 0){
      return Promise.resolve({result: "no task"})
    } else {
      return Promise.resolve({result: "ok", data: flex_data});
    }

  } else {
    return Promise.resolve({result: "updated"})
  }
}