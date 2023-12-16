const linebot_account = require("../../data/keys/LineAccount.json");
const linebot_sdk = require("@line/bot-sdk");
const linebot_client = new linebot_sdk.Client(linebot_account);

const { initializeApp, cert } = require("firebase-admin/app");
const serviceAccount = require("../../data/keys/ServiceAccount.json");
initializeApp({ credential: cert(serviceAccount) });
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const fs = require('fs');
const path = require('path');

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

const deleteAllAlias = async() => {
  let deleteCount = 0;
  (await linebot_client.getRichMenuAliasList()).aliases.forEach((aliasContent) => {
    linebot_client.deleteRichMenuAlias(aliasContent.richMenuAliasId);
    deleteCount++;
  })
  console.log(`${deleteCount}件のaliasが削除されました。`);
}

const deleteAllRichMenu = async() => {
  let deleteCount = 0;
  (await linebot_client.getRichMenuList()).forEach((richMenuContent) => {
    linebot_client.deleteRichMenu(richMenuContent.richMenuId);
    deleteCount++;
  });
  console.log(`${deleteCount}件のrichMenuが削除されました。`);
}

const checkAllRichMenu = async() => {
  const aliasList = (await linebot_client.getRichMenuAliasList()).aliases;
  const richMenuList = (await linebot_client.getRichMenuList());
  const result = {};

  let i = 1;
  richMenuList.forEach((richMenu) => {
    richMenu.richMenuAliasId = "";
    aliasList.forEach((aliasContent) => {
      if (aliasContent.richMenuId == richMenu.richMenuId) {
        richMenu.richMenuAliasId = aliasContent.richMenuAliasId;
        result[richMenu.richMenuAliasId] = aliasContent.richMenuId;
      }
    })
    console.log(`No.${i} ${richMenu.name}: \t\t\tid= ${richMenu.richMenuId}, alias= ${richMenu.richMenuAliasId}`);
    i++;
  })

  return result;
}

const saveToFile = async(to, richMenuIdDict) => {
  fs.writeFile(path.resolve(__dirname, to), JSON.stringify(richMenuIdDict), (err) => {
    if (err) {
      throw err;
    }
  });
}

const getLinkedUserIdList = async() => {
  const linkedUserIdList = [];
  (await db.collection("users").get()).forEach(doc => {
    const data = doc.data();
    if (data.account_status == "linked"){
      linkedUserIdList.push(doc.id);
    }
  });
  return linkedUserIdList;
}

(async() => {
  const config = require("./config.json");
  const richMenuIdDict = require(config.idSavePath);

  const saveIndex = await readUserInput("ID書き込み先のインデックスを選択（local/dev/prod）:");
  if (!["local", "dev", "prod"].includes(saveIndex)){
    console.log(`不正なインデックス：${saveIndex}\n`);
    return
  }

  console.log("----- 初期化開始 -----");
  await deleteAllAlias();
  await deleteAllRichMenu();
  console.log("");


  console.log("----- アップロード開始 -----");
  let linkedUserMenuId = ""
  for (const content of config.contents) {
    const richMenuObject = require(content.objectPath);
    const createdRichMenuId = await linebot_client.createRichMenu(richMenuObject);
    const image = fs.readFileSync(path.resolve(__dirname, content.imagePath));
    await linebot_client.setRichMenuImage(createdRichMenuId, image);
    await linebot_client.createRichMenuAlias(createdRichMenuId, content.alias);
    if (content.alias == config.linkedUserMenuAlias){
      linkedUserMenuId = createdRichMenuId;
    }
    if (content.alias == config.defaultMenuAlias){
      await linebot_client.setDefaultRichMenu(createdRichMenuId);
      console.log(`${createdRichMenuId}をデフォルトとして作成しました。`);
    } else {
      console.log(`${createdRichMenuId}を作成しました。`);
    }
  }
  console.log("");

  for (const linkedUserId of await getLinkedUserIdList()){
    if (!linkedUserId.includes("dev_")){
      linebot_client.linkRichMenuToUser(linkedUserId, linkedUserMenuId);
      console.log(`リンク済みのユーザー${linkedUserId}に${linkedUserMenuId}を設定しました。`);
    }
  }
  console.log("");

  console.log("----- アップロード結果 -----")
  const result = await checkAllRichMenu();
  console.log("");

  richMenuIdDict[saveIndex] = result;
  await saveToFile(config.idSavePath, richMenuIdDict);
  console.log(`${saveIndex}に記録しました。\n`);
})();