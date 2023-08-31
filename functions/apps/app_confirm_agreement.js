module.exports = (db, {user_id="", message=""}) => {
  if (message == "利用規約に同意し、\n初期設定を開始する"){
    db.collection("users").doc(user_id).update({
      account_status: "linking",
    });
    return Promise.resolve();

  } else {
    return Promise.reject();
  }
}