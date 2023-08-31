module.exports = async(db, {user_id=""}) => {
  if (user_id == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  
  const doc_data = await db.collection("tasks").doc(user_id).get();
  if (!doc_data.exists){
    return Promise.reject(new Error("Data not found"));

  } else {
    const res = doc_data.data();
    Object.keys(doc_data.data()).forEach((key) => {
      const limit_jst = doc_data.data()[key].task_limit.toDate();
      // 日本標準時に戻す必要があったら下を有効化
      // limit_jst.setHours(limit_jst.getHours()+9);
      // console.log("overwrite: ", doc_data.data()[key].task_limit.toDate(), " -> ", limit_jst)
      const { Timestamp } = require('firebase-admin/firestore');
      res[key].task_limit = Timestamp.fromDate(limit_jst);
    })

    const data_formatter = require("../file_modules/data_formatter");
    const flex_data = data_formatter.json_to_flex({
      tasks: res
    });

    return Promise.resolve(flex_data);
  }
}