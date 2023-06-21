const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();

// ----------------------------------------------
// データ作成
// ----------------------------------------------
/**
 * 新規ユーザーデータの作成
 * @param {String} user_id ユーザーのLINEID
 * @param {String} user_name ユーザーのLINEネーム
 * @returns {Promise<String>} done
 */
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


// ----------------------------------------------
// データ更新
// ----------------------------------------------
/**
 * 指定のデータを更新する
 * @param {String} collection コレクション名
 * @param {String} doc ドキュメント名
 * @param {Object} data 更新するデータ
 * @returns
 */
exports.set_data = async ({collection="", doc="", data={}}) => {
  if (collection == "" || doc == "" || data == {}){
    return Promise.reject(new Error("Parameter not defined"));
  }
  await db.collection(collection).doc(doc).update(data);
  return Promise.resolve("done");
}

//授業データ追加
exports.add_class_data = async({class_code="", class_name=""}) => {
  await db.collection("overall").doc("classes").set({
    [class_code]: `${class_name}`
  },{ merge: true})
  return Promise.resolve("done");
}

// 課題データ追加
// exports.add_task_data = async({user_id="", task_data={}}) => {
//   await db.collection("tasks").doc(user_id).set({
//     class_name:
//     display: false,
//     finish:
//     serial_id:
//     task_limit:
//     task_name:
//   });
// }

//課題の完了処理
// exports.set_task_status = async({user_id="", task_serial_id=0, is_finish=null}) =>{
//   if (user_id == ""|| is_finish == null || task_serial_id == 0){
//     return Promise.reject(new Error("Parameter not found"));
//   }
//   await db.collection("tasks").doc(user_id).update({
//     //このままだと授業名指定されていないので入りません(要改善)
//     display: is_finish

//   })
// }


// ----------------------------------------------
// データ削除
// ----------------------------------------------

// ユーザー削除
exports.delete_user = async({user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  await db.collection("users").doc(user_id).delete();
  return Promise.resolve("done");
}
