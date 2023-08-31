module.exports = (db, {user_id="", message="", token=""}) => {
  if (message == "初めからやり直す"){
    db.collection("users").doc(user_id).update({
      account_status: "wait_student_id",
      student_id: "",
      temporary_data: ""
    });
    return Promise.resolve("retry");

  } else if (message == token){
    db.collection("users").doc(user_id).update({
      account_status: "authenticated",
      temporary_data: ""
    });
    return Promise.resolve("authenticated");

  } else {
    return Promise.reject();
  }
}