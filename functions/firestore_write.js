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
  return Promise.resolve("done");
}

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