module.exports = (db, {userId="", studentId=""}) => {
  db.collection("users").doc(userId).update({
    accountStatus: "linking",
    moodleGeneralId: "",
    moodleGeneralToken: "",
    moodleSpecificId: "",
    moodleSpecificToken: ""
  });

  const flexContents = require("../data/flexMessage/linkGuide.json");
  const userDepartment = studentId.match(/[LEJSMTAF]/i);
  const term = new Date();
  term.setMonth(term.getMonth()-3);

  const url_1 = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/g/calendar/export.php?openExternalBrowser=1`;
  const url_2 = `https://lms.ealps.shinshu-u.ac.jp/${term.getFullYear()}/${userDepartment}/calendar/export.php?openExternalBrowser=1`;

  return Promise.resolve({
    status: "done",
    message: {
      contents: JSON.parse(JSON.stringify(flexContents)
        .replace("$1", url_1)
        .replace("$2", url_2)),
      altText: "手順に従い、ACSUとの連携を行ってください。"
    }
  });
}