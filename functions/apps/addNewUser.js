module.exports = (db, {userId="", userName=""}) => {
  if (userId == "" || userName == ""){
    return Promise.reject(new Error("Parameter not defined"));
  }
  const { Timestamp } = require('firebase-admin/firestore');
  db.collection("users").doc(userId).set({
    accountStatus: "wait_studentId",
    moodleGeneralId: "",
    moodleGeneralToken: "",
    moodleSpecificId: "",
    moodleSpecificToken: "",
    registerDate: Timestamp.fromDate(new Date()),
    studentId: "",
    tempData: "",
    processStatus: "",
    notify: true,
    userName: `${userName}`
  });
  db.collection("tasks").doc(userId).set({});
  db.collection("overall").doc("names").set({[userName]: userId}, {merge: true});
  const flexContents = require("../data/flexMessage/addedFriend.json");

  return Promise.resolve({status: "done", message: {contents: flexContents, altText: "友だち追加ありがとうございます！"}});
}