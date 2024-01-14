module.exports = (db, {userId=""}) => {
  if (userId == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  db.collection("users").doc(userId).delete();
  db.collection("tasks").doc(userId).delete();
  db.collection("overall").doc("names").get().then((d) => {
    const overwrite = d.data();
    delete overwrite[Object.keys(overwrite).find(key => overwrite[key] == userId)];
    db.collection("overall").doc("names").set(overwrite);
  });
  return Promise.resolve({status: "done"});
}