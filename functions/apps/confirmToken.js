module.exports = (db, {userId="", message="", token=""}) => {
  if (message == "初めからやり直す"){
    db.collection("users").doc(userId).update({
      accountStatus: "wait_studentId",
      studentId: "",
      tempData: ""
    });
    const flexContents = require("../data/flexMessage/addedFriend.json");
    return Promise.resolve({status: "done", message: {contents: flexContents, altText: "もう一度初めからやり直してください。"}});

  } else if (message == token){
    db.collection("users").doc(userId).update({
      accountStatus: "authenticated",
      tempData: ""
    });
    const flexContents = require("../data/flexMessage/userPolicy.json")
    return Promise.resolve({status: "done", message: {contents: flexContents, altText: "利用規約をご確認ください。"}});

  } else {
    return Promise.resolve({status: "error"});
  }
}