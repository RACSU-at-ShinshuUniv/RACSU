/** @jsxImportSource @emotion/react */

import React from "react";

import Header from "./TaskListHeader";
import Footer from "./TaskListFooter";
import Contents from "../../src/component/TaskListContents";
import DeleteConfirmModal from "./DeleteConfirmModal";
import TaskAddModal from "./TaskAddModal";
import Loading from "./Loading";
import AccountExpired from "./AccountExpired";

import Box from "@mui/material/Box";

import {
  localStorageDataProps,
  syncStorageDataProps,
} from "../../src/background";

import { GASend } from "../../src/modules/googleAnalytics";
import UpdateMessageModal from "./UpdateMessageModal";

function App({ width }: { width: string }) {
  // ReactHook作成
  const [openModal_delFinish, setOpenModal_delFinish] = React.useState(false);
  const [openModal_delPast, setOpenModal_delPast] = React.useState(false);
  const [openModal_add, setOpenModal_add] = React.useState(false);
  const [openLoading, setOpenLoading] = React.useState(true);
  const [accountExpiredState, setAccountExpiredState] = React.useState({
    isOpen: false,
    message: "",
    settingCallback: () => {},
  });
  const [localDataState, setLocalDataState] = React.useState<{
    taskData: localStorageDataProps["userTask"];
    lastUpdate: localStorageDataProps["lastUpdate"];
  }>({
    taskData: {},
    lastUpdate: "",
  });
  const [displayLinkError, setDisplayLinkError] = React.useState(false);
  const [updateMessageTargetVersion, setUpdateMessageTargetVersion] = React.useState("");

  // 初期描画の非同期関数作成
  const initRendering = async () => {
    const userConfig =
      (await chrome.storage.sync.get()) as syncStorageDataProps;
    const localData = (await chrome.storage.local.get([
      "userTask",
      "lastUpdate",
    ])) as localStorageDataProps;
    setLocalDataState({
      taskData: localData.userTask,
      lastUpdate: localData.lastUpdate,
    });
    setUpdateMessageTargetVersion(userConfig.updateMessageTargetVersion ?? "");

    if (userConfig.accountStatus == "installed") {
      const optionsPage = chrome.runtime.getURL("pages/options/index.html");
      setAccountExpiredState({
        isOpen: true,
        message: "RACSUをご利用いただくにはeALPSとの連携が必要です。",
        settingCallback: () => {
          window.open(optionsPage, "_blank");
        },
      });
    } else if (userConfig.accountStatus == "linking") {
      const thisTerm = new Date();
      thisTerm.setMonth(thisTerm.getMonth() - 3);
      setAccountExpiredState({
        isOpen: true,
        message: "eALPSとの連携を完了してください。",
        settingCallback: () => {
          chrome.storage.sync.set({
            needToSetSpecific: true,
            accountStatus: "linking",
            moodleSpecificId: "",
            moodleSpecificToken: "",
            moodleGeneralId: "",
            moodleGeneralToken: "",
          });
          open(
            `https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/${userConfig.userDepartment}/calendar/export.php`,
            "_blank",
            "width=500,height=700",
          );
        },
      });
    } else if (userConfig.accountStatus == "accountExpired") {
      const optionsPage = chrome.runtime.getURL("pages/options/index.html");
      setAccountExpiredState({
        isOpen: true,
        message: "年度変更によりeALPSとの再連携が必要です。",
        settingCallback: () => {
          window.open(optionsPage, "_blank");
        },
      });
    } else if (userConfig.accountStatus == "linkError") {
      setDisplayLinkError(true);
    }

    setOpenLoading(false);
  };

  // 各ボタンのハンドラー作成
  // 初回のみの定義で良いものはuseCallbackを使用
  const updateHandler = React.useCallback(() => {
    setOpenLoading(true);
    chrome.runtime.sendMessage("taskDataUpdate").catch((e) => console.log(e));
    // GASend("taskUpdateManually", "execute");
  }, []);

  const settingHandler = React.useCallback(() => {
    const optionsPage = chrome.runtime.getURL("pages/options/index.html");
    window.open(optionsPage, "_blank");
  }, []);

  const checkHandler = React.useCallback((id: string, checked: boolean) => {
    // ローカルデータの完了フラグを立てる
    chrome.storage.local.get(["userTask"]).then((localData) => {
      const { userTask } = localData as localStorageDataProps;
      userTask[id].finish = checked;
      // if (checked) {
      //   GASend("taskCheck", "finish");
      // } else {
      //   GASend("taskCheck", "redo");
      // }

      chrome.storage.local.set({ userTask }).then(() => {
        chrome.runtime
          .sendMessage("taskWindowUpdateRequest")
          .catch((e) => console.log(e));
      });
    });
  }, []);

  const delPastHandler = React.useCallback(() => {
    setOpenModal_delPast(false);
    setOpenLoading(true);
    // GASend("taskDelete", "past");

    chrome.storage.local.get(["userTask"]).then((localData) => {
      const { userTask } = localData as localStorageDataProps;

      // 超過課題を取得
      document.querySelectorAll(".past").forEach((pastTask) => {
        pastTask
          .querySelectorAll("input[name=finish]")
          .forEach((pastCheckbox) => {
            // ローカルデータの非表示フラグを立てる
            userTask[pastCheckbox.id].display = false;
          });
      });

      chrome.storage.local.set({ userTask }).then(() => {
        chrome.runtime
          .sendMessage("taskWindowUpdateRequest")
          .catch((e) => console.log(e));
      });

      // ローディング解除
      setOpenLoading(false);
    });
  }, []);

  const delFinishHandler = React.useCallback(() => {
    setOpenModal_delFinish(false);
    setOpenLoading(true);
    // GASend("taskDelete", "finished");

    chrome.storage.local.get(["userTask"]).then((localData) => {
      const { userTask } = localData as localStorageDataProps;

      // 完了済みの課題を取得
      document
        .querySelectorAll("input[name=finish]:checked")
        .forEach((checkbox) => {
          // ローカルデータの非表示フラグを立てる
          userTask[checkbox.id].display = false;
        });

      chrome.storage.local.set({ userTask }).then(() => {
        chrome.runtime
          .sendMessage("taskWindowUpdateRequest")
          .catch((e) => console.log(e));
      });

      // ローディング解除
      setOpenLoading(false);
    });
  }, []);

  // 初回のみの実行関数
  React.useEffect(() => {
    // 課題更新のイベントリスナー作成
    chrome.runtime.onMessage.addListener((message) => {
      if (message == "taskWindowUpdate") {
        chrome.storage.local
          .get(["userTask", "lastUpdate"])
          .then((localData) => {
            // 課題データのStateを更新して再描画
            const { userTask, lastUpdate } = localData as localStorageDataProps;
            setLocalDataState({
              lastUpdate: lastUpdate,
              taskData: userTask,
            });

            // ローディング解除
            setOpenLoading(false);
          });
      } else if (
        message == "taskWindowReload" ||
        message == "autoSetupComplete"
      ) {
        window.location.reload();
      }
    });

    // 初期描画
    initRendering();
  }, []);

  console.log("Page rendering");
  return (
    <Box position="relative" width={width}>
      <Header
        lastUpdate={localDataState.lastUpdate}
        updateHandler={updateHandler}
        confirmDelFinishHandler={() => setOpenModal_delFinish(true)}
        confirmDelPastHandler={() => setOpenModal_delPast(true)}
        settingHandler={settingHandler}
        displayLinkError={displayLinkError}
      />
      <Box padding="0 10px" height="300px" overflow="auto">
        <Contents
          saveData={localDataState.taskData}
          checkHandler={checkHandler}
        />
      </Box>
      <Footer addHandler={() => setOpenModal_add(true)} />

      <DeleteConfirmModal
        modalIsOpen={openModal_delFinish}
        modalHandler={setOpenModal_delFinish}
        deleteType="完了済みの課題"
        deleteHandler={delFinishHandler}
      />
      <DeleteConfirmModal
        modalIsOpen={openModal_delPast}
        modalHandler={setOpenModal_delPast}
        deleteType="超過課題"
        deleteHandler={delPastHandler}
      />
      <TaskAddModal
        modalIsOpen={openModal_add}
        modalHandler={setOpenModal_add}
      />
      <Loading isOpen={openLoading} />
      <AccountExpired
        isOpen={accountExpiredState.isOpen}
        message={accountExpiredState.message}
        settingCallback={accountExpiredState.settingCallback}
      />
      <UpdateMessageModal updateMessageTargetVersion={updateMessageTargetVersion} />
    </Box>
  );
}

export default App;
