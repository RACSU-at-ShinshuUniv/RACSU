module.exports = async(db, {userId=""}) => {
  if (userId == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }

  const jsonTask = await db.collection("tasks").doc(userId).get();
  if (!jsonTask.exists){
    return Promise.reject(new Error("Data not found"));
  }

  const { JsonTask } = require("../lib/DataFormatter");
  const flexTask = (new JsonTask(jsonTask.data())).toFlex().get();

  return Promise.resolve({status: "done", message: flexTask});
}