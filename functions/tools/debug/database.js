const { initializeApp, cert } = require("firebase-admin/app");
const serviceAccount = require("../../data/keys/ServiceAccount.json");
initializeApp({ credential: cert(serviceAccount) });

const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const db = getFirestore();

const fs = require('fs');
const path = require('path');
require("date-utils");

const readUserInput = (question) => {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    readline.question(question, (answer) => {
      resolve(answer);
      readline.close();
    });
  });
}

const saveToFile = async(to, jsonData) => {
  fs.writeFile(path.resolve(__dirname, to), JSON.stringify(jsonData), (err) => {
    if (err) {
      throw err;
    }
  });
}

const getData = async() => {
  const allUserData = {}, allTaskData = {}, overall = {};
  (await db.collection("users").get()).forEach(doc => {
    const data = doc.data();
    allUserData[doc.id] = data;
    allUserData[doc.id].registerDate = data.registerDate.toDate().toFormat("YYYY/MM/DD HH24:MI:SS")
  });
  (await db.collection("tasks").get()).forEach(doc => {
    const data = doc.data();
    allTaskData[doc.id] = data;
  });
  (await db.collection("overall").get()).forEach(doc => {
    const data = doc.data();
    overall[doc.id] = data;
  });
  return {users: allUserData, tasks: allTaskData, overall: overall};
}

(async () => {
  const mode = await readUserInput("動作モードを選択（backup/restore）:");
  if (!["backup", "restore"].includes(mode)){
    console.log(`不正なインデックス：${mode}\n`);
    return
  }

  if (mode == "backup"){
    const { users, tasks, overall } = await getData();
    saveToFile("./backup/users.json", users);
    saveToFile("./backup/tasks.json", tasks);
    saveToFile("./backup/overall.json", overall);
    console.log("全データを保存しました。")
  }

})();