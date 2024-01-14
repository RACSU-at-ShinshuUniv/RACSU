module.exports = async(db, {userId=""}) => {
  if (userId == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }

  const jsonTask = await db.collection("tasks").doc(userId).get();
  if (!jsonTask.exists){
    return Promise.reject(new Error("Data not found"));
  }

  // 日本標準時にうまく戻ってくれないときは以下を有効化
  // Object.keys(jsonTask.data()).forEach((key) => {
  //   const limit_jst = jsonTask.data()[key].taskLimit.toDate();
    // limit_jst.setHours(limit_jst.getHours()+9);
    // console.log("overwrite: ", jsonTask.data()[key].taskLimit.toDate(), " -> ", limit_jst)
  //   const { Timestamp } = require('firebase-admin/firestore');
  //   res[key].taskLimit = Timestamp.fromDate(limit_jst);
  // })

  const { JsonTask } = require("../lib/DataFormatter");
  const flexTask = (new JsonTask(jsonTask.data())).toFlex().get();

  return Promise.resolve({status: "done", message: flexTask});
}