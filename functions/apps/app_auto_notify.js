module.exports = async(db, {user_id="", user_address=""}) => {
  if (user_address == "@shinshu-u.ac.jp"){
    return Promise.resolve({result: "ok", status: "address not detected"})
  }
  const account_data = (await db.collection("users").doc(user_id).get()).data();

  // ユーザーデータからical取得先URLに変換
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
  const data_formatter = require("../file_modules/data_formatter");
  const class_name_dic = (await db.collection("overall").doc("classes").get()).data();
  const task_data_general = await data_formatter.ical_to_json(db, {
    class_name_dic: class_name_dic,
    ical_data: ical_data_general
  });
  const task_data_specific = await data_formatter.ical_to_json(db, {
    class_name_dic: class_name_dic,
    ical_data: ical_data_specific
  });

  // icalからjsonに変換したデータと、すでにデータベースに登録済みの課題データをマージする
  // すでにデータベースに登録済みの課題について、登録されているdisplayとfinishの値をもってくる
  const tasks_reg = (await db.collection("tasks").doc(user_id).get()).data();
  const new_task_data = {...task_data_general, ...task_data_specific};

  Object.keys(new_task_data).forEach((key) => {
    if (key in tasks_reg){
      new_task_data[key].finish = tasks_reg[key].finish;
      new_task_data[key].display = tasks_reg[key].display;
    }
  });

  // データベースにのみ存在する課題（手動追加課題）をマージする
  Object.keys(tasks_reg).forEach((key) => {
    if (!(key in new_task_data)){
      new_task_data[key] = tasks_reg[key];
    }
  })

  // 過去の課題かつ完了フラグが立っているもののdisplayをfalseに設定
  Object.keys(new_task_data).forEach((key) => {
    if ((new_task_data[key].task_limit.toDate() < new Date()) && new_task_data[key].finish){
      new_task_data[key].display = false;
    }
  })

  // データベース更新
  db.collection("tasks").doc(user_id).set(new_task_data ,{merge: true});

  const json_mail_param = data_formatter.json_to_mail_param({
    tasks: new_task_data
  })

  if (Object.keys(json_mail_param.tasks_today).length == 0){
    return Promise.resolve({result: "ok", status: "today's task not found"});

  } else {
    const mail_sender = require("../file_modules/mail_sender");
    mail_sender({
      data: {
        method: "notify",
        address: user_address,
        tasks_today: json_mail_param.tasks_today,
        others: json_mail_param.others
      }
    })
    return Promise.resolve({result: "ok", status: "send notification"})
  }
}