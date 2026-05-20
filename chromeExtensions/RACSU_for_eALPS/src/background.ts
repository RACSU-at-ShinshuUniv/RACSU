import { IcalClient, getMoodleURL } from "./modules/IcalClient.js";
import {
  SyllabusClient,
  classNameDictProps,
} from "./modules/SyllabusClient.js";
import { IcalData, saveDataProps } from "./modules/DataFormatter.js";
import formatTimeCode from "./modules/formatTimeCode";
import { GASend } from "./modules/googleAnalytics.js";

export type localStorageDataProps = {
  classNameDict: classNameDictProps;
  userTask: saveDataProps;
  lastUpdate: string;
};

export type syncStorageDataProps = {
  needToSetGeneral: boolean;
  needToSetSpecific: boolean;
  userDepartment: string;
  moodleGeneralId: string;
  moodleGeneralToken: string;
  moodleSpecificId: string;
  moodleSpecificToken: string;
  accountStatus:
    | "installed"
    | "linking"
    | "linked"
    | "linkError"
    | "accountExpired";
  accountExpiration: string;
  displayList: boolean;
  errorMessage?: string;
  updateMessageTargetVersion?: string;
};

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
      displayList: true,
      errorMessage: "",
    });
    chrome.storage.local.set({
      classNameDict: {},
      userTask: {},
      lastUpdate: "",
    });
    chrome.tabs.create({
      url:
        "chrome-extension://" + chrome.runtime.id + "/pages/options/index.html",
    });

    // GASend("install", "new");
  } else if (details.reason === "update") {
    if (
      details.previousVersion === "1.3.4" ||
      details.previousVersion === "1.3.5"
    ) {
      // 1.3.4 -> 1.3.5のアップデート
      // 1.3.5 -> 1.3.6のアップデート
      // 教職系の講義名データの再取得
      (async () => {
        const localData =
          (await chrome.storage.local.get()) as localStorageDataProps;

        // 講義名データのうちシラバス未登録授業のコードを削除
        Object.keys(localData.classNameDict).forEach((classCode) => {
          if (localData.classNameDict[classCode] == "シラバス未登録授業") {
            delete localData.classNameDict[classCode];
          }
        });
        await chrome.storage.local.set({
          classNameDict: localData.classNameDict,
        });

        // 課題を強制更新
        await updateTaskData();
      })();
    } else if (details.previousVersion === "1.3.7.2") {
      // 1.3.7.2 -> 1.3.8のアップデート
      // 講義名データのうちシラバス未登録授業のコードを再取得
      chrome.storage.sync.set({
        updateMessageTargetVersion: "1.3.8"
      });

      (async () => {
        const localData =
          (await chrome.storage.local.get()) as localStorageDataProps;

        // 講義名データのうちシラバス未登録授業のコードを削除
        Object.keys(localData.classNameDict).forEach((classCode) => {
          if (localData.classNameDict[classCode] == "シラバス未登録授業") {
            delete localData.classNameDict[classCode];
          }
        });
        await chrome.storage.local.set({
          classNameDict: localData.classNameDict,
        });

        // 課題を強制更新
        await updateTaskData();
      })();
    }
  } else {
  }
});

const updateTaskData = async () => {
  const isBlank = (value: string | null | undefined): boolean => {
    console.log("isBlank check:", value);
    return value == null || value.trim() === "";
  };
  const userConfig = (await chrome.storage.sync.get()) as syncStorageDataProps;

  // アカウントがリンク状態ではないなら自動更新をスキップ
  if (userConfig.accountStatus !== "linked") {
    chrome.runtime.sendMessage("taskWindowReload").catch((e) => console.log(e));
    return;
  }

  // データが完備されていない場合は連携エラーとして処理
  if (
    isBlank(userConfig.accountExpiration) ||
    isBlank(userConfig.userDepartment)
  ) {
    chrome.storage.sync.set({
      accountStatus: "linkError",
      errorMessage: "accountExpiration or userDepartment is blank",
    });
    chrome.runtime.sendMessage("taskWindowReload").catch((e) => console.log(e));
    return;
  } else if (
    isBlank(userConfig.moodleGeneralId) ||
    isBlank(userConfig.moodleGeneralToken)
  ) {
    chrome.storage.sync.set({
      accountStatus: "linkError",
      errorMessage: "moodleGeneralId or moodleGeneralToken is blank",
    });
    chrome.runtime.sendMessage("taskWindowReload").catch((e) => console.log(e));
    return;
  } else if (
    isBlank(userConfig.moodleSpecificId) ||
    isBlank(userConfig.moodleSpecificToken)
  ) {
    chrome.storage.sync.set({
      accountStatus: "linkError",
      errorMessage: "moodleSpecificId or moodleSpecificToken is blank",
    });
    chrome.runtime.sendMessage("taskWindowReload").catch((e) => console.log(e));
    return;
  }

  const moodleURL_g = getMoodleURL({
    accountExpiration: userConfig.accountExpiration,
    userDepartment: "g",
    moodleId: userConfig.moodleGeneralId,
    moodleToken: userConfig.moodleGeneralToken,
  });
  const moodleURL_s = getMoodleURL({
    accountExpiration: userConfig.accountExpiration,
    userDepartment: userConfig.userDepartment,
    moodleId: userConfig.moodleSpecificId,
    moodleToken: userConfig.moodleSpecificToken,
  });
  console.log("Moodle URL (general):", moodleURL_g);
  console.log("Moodle URL (specific):", moodleURL_s);
  const icalClient = new IcalClient(moodleURL_g, moodleURL_s);

  try {
    const { userTask, classNameDict } = (await chrome.storage.local.get([
      "userTask",
      "classNameDict",
    ])) as localStorageDataProps;
    const icalSource = await icalClient.getLatestContents();

    // 正常なデータ取得ができなかった場合は連携エラーとして処理
    if (icalSource.status == "invalidDataError") {
      chrome.storage.sync.set({
        accountStatus: "linkError",
        errorMessage: `Invalid URL: ${icalSource.data}`,
      });
      chrome.runtime
        .sendMessage("taskWindowReload")
        .catch((e) => console.log(e));
      return;
    }

    const syllabusClient = new SyllabusClient(classNameDict);
    const overwriteIcalSource = await syllabusClient.overwriteIcalClassCode(
      icalSource.data,
    );

    const icalData = new IcalData(overwriteIcalSource);
    const saveData = icalData
      .removeInvalidEvent()
      .formatToSaveData()
      .margeWith(userTask)
      .get();

    const today = formatTimeCode(new Date());
    await chrome.storage.local.set({
      userTask: saveData,
      lastUpdate: `${today.date} ${today.time}`,
    });
    chrome.runtime
      .sendMessage("taskWindowUpdate")
      .then(() => console.log("send taskWindowUpdate"))
      .catch((e) => console.log(e));
    console.log("課題の更新が完了しました：", saveData);
  } catch (e) {
    chrome.storage.sync.set({
      accountStatus: "linkError",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    chrome.runtime.sendMessage("taskWindowReload").catch((e) => console.log(e));
  }
};

// 定期更新登録
chrome.alarms.create("autoUpdater", { periodInMinutes: 10 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name == "autoUpdater") {
    updateTaskData();
  }
});

// メッセージリスナー登録
chrome.runtime.onMessage.addListener((message) => {
  console.log("サービスワーカーでメッセージを受信：", message);

  if (message == "taskDataUpdate") {
    updateTaskData();
    return;
  } else if (message == "taskWindowUpdate") {
    return;
  } else if (message == "taskWindowUpdateRequest") {
    chrome.runtime.sendMessage("taskWindowUpdate").catch((e) => console.log(e));
    return;
  } else if (message == "taskWindowReload") {
    return;
  } else {
    return;
  }
});

// 連携情報の期限切れを確認
chrome.storage.sync.get().then((userConfig) => {
  const thisTerm = new Date();
  thisTerm.setMonth(thisTerm.getMonth() - 3);
  if (
    userConfig.accountStatus == "linked" &&
    userConfig.accountExpiration !== String(thisTerm.getFullYear())
  ) {
    chrome.storage.sync.set({
      accountStatus: "accountExpired",
    });
  }
});

// 起動時更新
updateTaskData();
