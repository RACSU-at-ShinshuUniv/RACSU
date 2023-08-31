module.exports = (db, {user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  db.collection("users").doc(user_id).delete();
  db.collection("tasks").doc(user_id).delete();
  return Promise.resolve("done");
}