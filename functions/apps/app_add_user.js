module.exports = (db, {user_id="", user_name=""}) => {
  if (user_id == "" || user_name == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  const { Timestamp } = require('firebase-admin/firestore');
  db.collection("users").doc(user_id).set({
    account_status: "wait_student_id",
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
  db.collection("tasks").doc(user_id).set({});
  return Promise.resolve("done");
}