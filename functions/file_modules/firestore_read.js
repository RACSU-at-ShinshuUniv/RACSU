const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();

exports.get_account_data = async({user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  const doc_data = await db.collection("users").doc(user_id).get();
  if (!doc_data.exists){
    return Promise.reject(new Error("Data not found"));
  } else {
    return Promise.resolve(doc_data.data());
  }
}

exports.get_linked_account_id = async() => {
  const collection = db.collection("users");
  const doc_data = await collection.where('account_status', '==', "linked").get();
  return Promise.resolve(doc_data);
}

exports.get_all_data = async({collection=""}) => {
  if (collection == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  const doc_data = await db.collection(collection).get();
  if (!doc_data.exists){
    return Promise.reject(new Error("Data not found"));
  } else {
    return Promise.resolve(doc_data.data());
  }
}

exports.get_data = async({collection="", doc=""}) => {
  if (collection == "" || doc == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  const doc_data = await db.collection(collection).doc(doc).get();
  if (!doc_data.exists){
    return Promise.reject(new Error("Data not found"));
  } else {
    return Promise.resolve(doc_data.data());
  }
}

exports.get_task = async({user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  const doc_data = await db.collection("tasks").doc(user_id).get();
  if (!doc_data.exists){
    return Promise.reject(new Error("Data not found"));
  } else {
    const res = doc_data.data();
    Object.keys(doc_data.data()).forEach((key) => {
      const limit_jst = doc_data.data()[key].task_limit.toDate();
      // 日本標準時に戻す必要があったら下を有効化
      // limit_jst.setHours(limit_jst.getHours()+9);
      // console.log("overwrite: ", doc_data.data()[key].task_limit.toDate(), " -> ", limit_jst)
      res[key].task_limit = Timestamp.fromDate(limit_jst);
    })

    return Promise.resolve(res);
  }
}

exports.get_cal_url = async({user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  const doc_data = await db.collection("users").doc(user_id).get();
  if (!doc_data.exists){
    return Promise.reject(new Error("Data not found"));
  } else {
    const user_data = doc_data.data();
    const term = new Date();
    term.setMonth(term.getMonth()-3);
    const user_department = user_data.student_id.match(/[LEJSMTAF]/i);

    const url_g = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export_execute.php?userid=${user_data.moodle_general_id}&authtoken=${user_data.moodle_general_token}&preset_what=all&preset_time=recentupcoming`
    const url_s = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${user_department}/calendar/export_execute.php?userid=${user_data.moodle_specific_id}&authtoken=${user_data.moodle_specific_token}&preset_what=all&preset_time=recentupcoming`

    return Promise.resolve({general: url_g, specific: url_s});
  }
}
