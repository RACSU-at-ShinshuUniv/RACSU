const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();

// 新規ユーザー追加
exports.add_user = async ({user_id="", user_name=""}) => {
  if (user_id == "" || user_name == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  await db.collection("users").doc(user_id).set({
    account_status: "authenticating",
    moodle_general_id: "",
    moodle_general_token: "",
    moodle_specific_id: "",
    moodle_specific_token: "",
    register_date: Timestamp.fromDate(new Date()),
    student_id: "",
    temporary_data: "",
    process_status: "",
    user_name: `${user_name}`
  });
  await db.collection("tasks").doc(user_id).set({});
  return Promise.resolve("done");
}
// key = 'kagi';
// dict = {[key]: 'value'};
// console.log(dict);
// >> {kagi: "value"}
// ユーザー削除
exports.delete_user = async({user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  await db.collection("users").doc(user_id).delete();
  return Promise.resolve("done");
}

// データ更新
exports.set_data = async ({collection="", doc="", data={}}) => {
  if (collection == "" || doc == "" || data == {}){
    return Promise.reject(new Error("Parameter not defined"));
  }
  await db.collection(collection).doc(doc).update(data);
  return Promise.resolve("done");
}

//授業データ追加
exports.add_class_name_data = async({class_code="", class_name=""}) => {
  await db.collection("overall").doc("classes").set({
    [class_code]: `${class_name}`
  },{ merge: true})
  return Promise.resolve("done");
}

// exports.save_task = async({user_id, class_name, class_code, user_name}) => {
//   await db.collection("tasks").doc(user_id).set({
//     class_name: `${class_name}`,
//     display: false, 
//     finish:
//     serial_id:
//     task_limit:
//     task_name:
//   });
// }

exports.set_task_status = async({user_id="", is_finish=null, task_serial_id=0}) =>{
  if (user_id == ""|| is_finish == null || task_serial_id == 0){
    return Promise.reject(new Error("Parameter not found"));
  }
  await db.collection("tasks").doc(user_id).update({
    //このままだと授業名指定されていないので入りません(要改善)
    display: is_finish

  })
}