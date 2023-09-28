module.exports = (db, {user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  db.collection("users").doc(user_id).delete();
  db.collection("tasks").doc(user_id).delete();
  db.collection("overall").doc("names").get().then((d) => {
    let overwrite = d.data();
    delete overwrite[Object.keys(overwrite).find(key => overwrite[key] == user_id)];
    db.collection("overall").doc("names").set(overwrite);
  });
  return Promise.resolve("done");
}