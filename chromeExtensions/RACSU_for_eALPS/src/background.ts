import { IcalClient } from "./modules/IcalClient.js";
import { SyllabusClient } from "./modules/SyllabusClient.js";
import { IcalData } from "./modules/DataFormatter.js";
import formatTimeCode from "./modules/formatTimeCode";

chrome.alarms.clearAll();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "install") {
    // インストール直後
    chrome.storage.sync.clear();
    chrome.storage.sync.set({
      needToSetGeneral: false,
      needToSetSpecific: false,
      userDepartment: "",
      moodleGeneralId: "",
      moodleGeneralToken: "",
      moodleSpecificId: "",
      moodleSpecificToken: "",
      accountStatus: "installed",
      accountExpiration: "",
      displayList: true
    });
    chrome.storage.local.set({
      classNameDict: {},
      userTask: {},
      lastUpdate: ""
    });
    chrome.tabs.create({
      url: "chrome-extension://" + chrome.runtime.id + "/pages/options/index.html"
    });

  } else {
  }
});

const updateTaskData = async() => {
  const userConfig = await chrome.storage.sync.get();

  const moodleURL_g = `https://lms.ealps.shinshu-u.ac.jp/${userConfig.accountExpiration}/g/calendar/export_execute.php?userid=${userConfig.moodleGeneralId}&authtoken=${userConfig.moodleGeneralToken}&preset_what=all&preset_time=recentupcoming`;
  const moodleURL_s = `https://lms.ealps.shinshu-u.ac.jp/${userConfig.accountExpiration}/${userConfig.userDepartment}/calendar/export_execute.php?userid=${userConfig.moodleSpecificId}&authtoken=${userConfig.moodleSpecificToken}&preset_what=all&preset_time=recentupcoming`;

  const icalClient = new IcalClient(moodleURL_g, moodleURL_s);

  try {
    const icalSource = await icalClient.getLatestContents();
    const {userTask, classNameDict} = await chrome.storage.local.get(["userTask", "classNameDict"]);
    const syllabusClient = new SyllabusClient(classNameDict);
    const overwriteIcalSource = await syllabusClient.overwriteIcalClassCode(icalSource);

    const icalData = new IcalData(overwriteIcalSource);
    // const saveData = icalData.removeInvalidEvent().formatToSaveData().get();
    const saveData = icalData.removeInvalidEvent().formatToSaveData().margeWith(userTask).get();

    const today = formatTimeCode(new Date());
    await chrome.storage.local.set({
      userTask: saveData,
      lastUpdate: `${today.date} ${today.time}`
    });
    chrome.runtime.sendMessage({
      type: "update",
      status: "complete"
    }).catch((e) => console.log(e));
    console.log("課題の更新が完了しました：", saveData);

  } catch(e) {
    console.log(e);
    chrome.runtime.sendMessage({
      type: "update",
      status: "error"
    }).catch((e) => console.log(e));
  }
}

// 定期更新登録
chrome.alarms.create("autoUpdater", {"periodInMinutes": 10});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name == "autoUpdater"){
    updateTaskData();
  }
});

// メッセージリスナー登録
chrome.runtime.onMessage.addListener((message) => {
  console.log("サービスワーカーでメッセージを受信しました：", message);

  if (message.type == "update"){
    if (message.status == "start"){
      updateTaskData();
    }

  } else if (message.type == "setting"){
    if (message.status == "complete"){
      chrome.storage.sync.get().then(res => console.log("eALPSとの連携情報を登録しました：", res));
      updateTaskData();
    }

  } else if (message.type == "refresh"){
    if (message.status == "request"){
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "refresh",
          status: "execution"
        }).catch((_e) => {});
      }, 100);
    }
  }
});

// 連携情報の期限切れを確認
chrome.storage.sync.get().then(userConfig => {
  const thisTerm = new Date();
  thisTerm.setMonth(thisTerm.getMonth()-3);
  if (userConfig.accountStatus == "linked" && userConfig.accountExpiration !== String(thisTerm.getFullYear())){
    chrome.storage.sync.set({
      accountStatus: "accountExpired"
    });
  }
});
