import { IcalClient, getMoodleURL } from "./modules/IcalClient.js";
import {
  SyllabusClient,
  classNameDictProps,
} from "./modules/SyllabusClient.js";
import { IcalData, saveDataProps } from "./modules/DataFormatter.js";
import formatTimeCode from "./modules/formatTimeCode";
import { GASend } from "./modules/googleAnalytics.js";

type localStorageDataProps = {
  classNameDict: classNameDictProps;
  userTask: saveDataProps;
  lastUpdate: string;
};

type syncStorageDataProps = {
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
    }
  } else {
  }
});

const updateTaskData = async () => {
  const isBlank = (value: string | null | undefined): boolean => {
    return value == null || value.trim() === "";
  };
  const userConfig = (await chrome.storage.sync.get()) as syncStorageDataProps;

  // アカウントがリンク状態ではないなら自動更新をスキップ
  if (userConfig.accountStatus !== "linked") {
    return;
  }

  // データ完備を確認
  if (
    isBlank(userConfig.accountExpiration) ||
    isBlank(userConfig.userDepartment)
  ) {
    chrome.storage.sync.set({
      accountStatus: "linkError_env",
    });
    chrome.runtime
      .sendMessage({
        type: "update",
        status: "error",
      })
      .catch((e) => console.log(e));
    return;
  } else if (
    isBlank(userConfig.moodleGeneralId) ||
    isBlank(userConfig.moodleGeneralToken)
  ) {
    chrome.storage.sync.set({
      accountStatus: "linkError_general",
    });
    chrome.runtime
      .sendMessage({
        type: "update",
        status: "error",
      })
      .catch((e) => console.log(e));
    return;
  } else if (
    isBlank(userConfig.moodleSpecificId) ||
    isBlank(userConfig.moodleSpecificToken)
  ) {
    chrome.storage.sync.set({
      accountStatus: "linkError_specific",
    });
    chrome.runtime
      .sendMessage({
        type: "update",
        status: "error",
      })
      .catch((e) => console.log(e));
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

  const icalClient = new IcalClient(moodleURL_g, moodleURL_s);

  try {
    const { userTask, classNameDict } = (await chrome.storage.local.get([
      "userTask",
      "classNameDict",
    ])) as localStorageDataProps;
    const icalSource = await icalClient.getLatestContents();
    if (icalSource.status == "invalidDataError") {
      if (icalSource.data == moodleURL_g) {
        chrome.storage.sync.set({
          accountStatus: "linkError_general",
        });
      } else if (icalSource.data == moodleURL_s) {
        chrome.storage.sync.set({
          accountStatus: "linkError_specific",
        });
      } else {
        chrome.storage.sync.set({
          accountStatus: "linkError",
        });
      }
      chrome.runtime
        .sendMessage({
          type: "update",
          status: "error",
        })
        .catch((e) => console.log(e));
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
      .sendMessage({
        type: "update",
        status: "complete",
      })
      .catch((e) => console.log(e));
    console.log("課題の更新が完了しました：", saveData);
  } catch (e) {
    chrome.runtime
      .sendMessage({
        type: "update",
        status: "error",
      })
      .catch((e) => console.log(e));
  } finally {
    console.log("描画を更新");
    chrome.runtime
      .sendMessage({
        type: "refresh",
        status: "execution",
      })
      .catch((e) => console.log(e));
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
  console.log("サービスワーカーでメッセージを受信しました：", message);

  if (message.type == "update") {
    if (message.status == "start") {
      updateTaskData();
    } else if (message.status == "error") {
      chrome.runtime
        .sendMessage({
          type: "refresh",
          status: "execution",
        })
        .catch((_e) => {});
    }
  } else if (message.type == "setting") {
    if (message.status == "complete") {
      chrome.storage.sync
        .get()
        .then((res) => console.log("eALPSとの連携情報を登録しました：", res));
      updateTaskData();
    }
  } else if (message.type == "refresh") {
    if (message.status == "request") {
      setTimeout(() => {
        chrome.runtime
          .sendMessage({
            type: "refresh",
            status: "execution",
          })
          .catch((_e) => {});
      }, 100);
    }
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
